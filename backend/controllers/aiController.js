/**
 * aiController.js
 * Integrates Node.js backend with the Python FastAPI AI service.
 *
 * Flow for each prediction:
 *  1. Fetch relevant patient data from the SQLite database
 *  2. Send data to the AI service (URL from env: AI_SERVICE_URL)
 *  3. Persist the full result to the AIPrediction table
 *  4. Return the result to the API caller
 *
 * On AI service failure → returns HTTP 503 with a clear message instead of crashing.
 */

const axios = require('axios');
const Patient = require('../models/Patient');
const Diagnosis = require('../models/Diagnosis');
const PatientHistory = require('../models/PatientHistory');
const VitalSigns = require('../models/VitalSigns');
const Doctor = require('../models/Doctor');
const AIPrediction = require('../models/AIPrediction');
const logger = require('../utils/logger');

// Read AI service URL from environment (fallback to localhost for dev)
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// ─── Helper: determine current season ─────────────────────────────────────────

function getSeason(month) {
    if ([12, 1, 2].includes(month)) return 'Winter';
    if ([3, 4, 5].includes(month))  return 'Spring';
    if ([6, 7, 8].includes(month))  return 'Summer';
    return 'Autumn';
}

// ─── Helper: extract top-level risk string from AI response ───────────────────

function extractRiskLevel(predictionType, resultData) {
    try {
        if (predictionType === 'seasonal') {
            const forecast = resultData['Patient Forecast'];
            const top = forecast && forecast['Top Risks'] && forecast['Top Risks'][0];
            return top ? top.disease : 'Unknown';
        }
        if (predictionType === 'progression') {
            const analysis = resultData['Patient Risk Analysis'];
            return analysis ? analysis['Overall Risk Level'] : 'Unknown';
        }
    } catch (_) {}
    return 'Unknown';
}

// ─── POST /api/ai/seasonal-prediction ─────────────────────────────────────────

/**
 * Pulls real patient data from DB, sends to AI service,
 * stores result in AIPrediction table, returns result.
 */
exports.getSeasonalPrediction = async (req, res, next) => {
    try {
        const { patientId } = req.body;

        if (!patientId) {
            return res.status(400).json({ message: 'patientId is required' });
        }

        // ── 1. Load patient from DB ──────────────────────────────────────
        const patient = await Patient.findByPk(patientId, {
            attributes: { exclude: ['password'] }
        });
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // ── 2. Calculate age ─────────────────────────────────────────────
        const birthDate = new Date(patient.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear() -
            ((today.getMonth() < birthDate.getMonth() ||
              (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) ? 1 : 0);

        // ── 3. Season & month ────────────────────────────────────────────
        const month = today.getMonth() + 1;
        const season = getSeason(month);

        // ── 4. Pull diagnosis history from DB ────────────────────────────
        const diagnoses = await Diagnosis.findAll({
            where: { patientId },
            attributes: ['condition', 'severity', 'symptoms', 'dateDiagnosed', 'status'],
            order: [['dateDiagnosed', 'DESC']]
        });
        const previous_diseases = diagnoses.length > 0
            ? diagnoses.map(d => d.condition).filter(Boolean)
            : ['None'];

        // ── 5. Pull chronic conditions from PatientHistory ───────────────
        const historyEntries = await PatientHistory.findAll({
            where: { patientId },
            attributes: ['chronicConditions'],
            order: [['recordedAt', 'DESC']],
            limit: 1
        });
        const chronic_conditions = (historyEntries.length > 0 && Array.isArray(historyEntries[0].chronicConditions))
            ? historyEntries[0].chronicConditions
            : [];

        // ── 6. Build input payload ───────────────────────────────────────
        const inputPayload = {
            patient_id: patient.id,
            age,
            month,
            season,
            previous_diseases,
            chronic_conditions
        };

        // ── 7. Call AI service ───────────────────────────────────────────
        let aiResult;
        let aiStatus = 'success';

        try {
            const aiResponse = await axios.post(
                `${AI_SERVICE_URL}/ai/seasonal-prediction`,
                inputPayload,
                { timeout: 10000 }
            );
            aiResult = aiResponse.data;
        } catch (aiError) {
            aiStatus = 'error';
            const isOffline = !aiError.response;
            logger.error('[AI Service] Seasonal prediction failed', { error: aiError.message });

            await AIPrediction.create({
                patientId,
                predictionType: 'seasonal',
                inputData: inputPayload,
                resultData: { error: aiError.message },
                riskLevel: 'Unknown',
                aiServiceStatus: 'error'
            });

            return res.status(503).json({
                message: isOffline
                    ? 'AI service is offline. Please start the Python AI service on port 8000.'
                    : 'AI service returned an error.',
                detail: aiError.response ? aiError.response.data : aiError.message
            });
        }

        // ── 8. Persist result to database ────────────────────────────────
        const riskLevel = extractRiskLevel('seasonal', aiResult);

        await AIPrediction.create({
            patientId,
            predictionType: 'seasonal',
            inputData: inputPayload,
            resultData: aiResult,
            riskLevel,
            aiServiceStatus: aiStatus
        });

        logger.info(`[AI] Seasonal prediction stored`, { patientId, riskLevel });

        // ── 9. Return result ─────────────────────────────────────────────
        res.json(aiResult);

    } catch (error) {
        logger.error('[AI Controller] Seasonal prediction error', { error: error.message });
        next(error);
    }
};

// ─── POST /api/ai/disease-progression ─────────────────────────────────────────

/**
 * Pulls diagnosis history, vitals, and chronic conditions from DB,
 * sends to AI service, stores result, returns result.
 */
exports.getDiseaseProgression = async (req, res, next) => {
    try {
        const { patientId } = req.body;

        if (!patientId) {
            return res.status(400).json({ message: 'patientId is required' });
        }

        // ── 1. Validate patient exists ───────────────────────────────────
        const patient = await Patient.findByPk(patientId, {
            attributes: { exclude: ['password'] }
        });
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // ── 2. Fetch full diagnosis timeline ────────────────────────────
        const diagnoses = await Diagnosis.findAll({
            where: { patientId },
            include: [{ model: Doctor, attributes: ['name', 'specialization'] }],
            order: [['dateDiagnosed', 'ASC']]
        });

        // ── 3. Fetch latest vital signs ──────────────────────────────────
        const vitals = await VitalSigns.findAll({
            where: { patientId },
            order: [['recordedAt', 'DESC']],
            limit: 5
        });

        // ── 4. Fetch patient history (chronic conditions) ────────────────
        const historyEntries = await PatientHistory.findAll({
            where: { patientId },
            order: [['recordedAt', 'DESC']],
            limit: 1
        });

        // ── 5. Format for AI service ─────────────────────────────────────
        const diagnosisHistory = diagnoses.map(d => ({
            disease: d.condition,
            severity: d.severity,
            symptoms: d.symptoms,
            date: d.dateDiagnosed,
            status: d.status,
            doctor: d.Doctor ? d.Doctor.name : null
        }));

        const latestVitals = vitals.length > 0 ? {
            bloodPressure:    vitals[0].bloodPressure,
            heartRate:        vitals[0].heartRate,
            temperature:      vitals[0].temperature,
            oxygenSaturation: vitals[0].oxygenSaturation,
            weight:           vitals[0].weight,
            recordedAt:       vitals[0].recordedAt
        } : null;

        const chronicConditions = (historyEntries.length > 0 && Array.isArray(historyEntries[0].chronicConditions))
            ? historyEntries[0].chronicConditions
            : [];

        // ── 6. Build input payload ───────────────────────────────────────
        const inputPayload = {
            patient_id: patient.id,
            history: diagnosisHistory,
            vitals: latestVitals,
            chronic_conditions: chronicConditions
        };

        // ── 7. Call AI service ───────────────────────────────────────────
        let aiResult;
        let aiStatus = 'success';

        try {
            const aiResponse = await axios.post(
                `${AI_SERVICE_URL}/ai/disease-progression`,
                inputPayload,
                { timeout: 10000 }
            );
            aiResult = aiResponse.data;
        } catch (aiError) {
            aiStatus = 'error';
            const isOffline = !aiError.response;
            logger.error('[AI Service] Disease progression failed', { error: aiError.message });

            await AIPrediction.create({
                patientId,
                predictionType: 'progression',
                inputData: inputPayload,
                resultData: { error: aiError.message },
                riskLevel: 'Unknown',
                aiServiceStatus: 'error'
            });

            return res.status(503).json({
                message: isOffline
                    ? 'AI service is offline. Please start the Python AI service on port 8000.'
                    : 'AI service returned an error.',
                detail: aiError.response ? aiError.response.data : aiError.message
            });
        }

        // ── 8. Persist result to database ────────────────────────────────
        const riskLevel = extractRiskLevel('progression', aiResult);

        await AIPrediction.create({
            patientId,
            predictionType: 'progression',
            inputData: inputPayload,
            resultData: aiResult,
            riskLevel,
            aiServiceStatus: aiStatus
        });

        logger.info(`[AI] Progression analysis stored`, { patientId, riskLevel });

        // ── 9. Return result ─────────────────────────────────────────────
        res.json(aiResult);

    } catch (error) {
        logger.error('[AI Controller] Disease progression error', { error: error.message });
        next(error);
    }
};

// ─── GET /api/ai/predictions/:patientId ───────────────────────────────────────

/**
 * Returns all stored AI prediction results for a specific patient,
 * ordered newest first.
 */
exports.getPatientPredictions = async (req, res, next) => {
    try {
        const { patientId } = req.params;

        const patient = await Patient.findByPk(patientId, {
            attributes: ['id', 'name']
        });
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        const predictions = await AIPrediction.findAll({
            where: { patientId },
            attributes: ['id', 'predictionType', 'riskLevel', 'aiServiceStatus', 'resultData', 'inputData', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            patientId,
            patientName: patient.name,
            totalPredictions: predictions.length,
            predictions
        });

    } catch (error) {
        logger.error('[AI Controller] Get predictions error', { error: error.message });
        next(error);
    }
};

// ─── POST /api/ai/ask ─────────────────────────────────────────────────────────

/**
 * Conversational AI diagnostics (legacy mock fallback).
 * Accepts:  { message: string }
 * Returns:  { reply: string }
 */
exports.askAI = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || typeof message !== 'string' || message.trim() === '') {
            return res.status(400).json({ reply: 'Iltimos, savol yoki simptomlaringizni kiriting.' });
        }

        const trimmed = message.trim().toLowerCase();
        let reply;

        if (trimmed.includes('bosh') || trimmed.includes('boshim') || trimmed.includes("bosh og'riq")) {
            reply = "Bosh og'riq ko'p sababli bo'lishi mumkin: stress, uyqu yetishmasligi, qon bosimi o'zgarishi yoki migren. Agar og'riq kuchli va uzoq davom etsa, shifokorga murojaat qilishingizni tavsiya qilaman.";
        } else if (trimmed.includes('harorat') || trimmed.includes('isitma') || trimmed.includes('tem')) {
            reply = "Yuqori harorat (38°C dan yuqori) odatda infeksion kasallik belgisi. Ko'p suv iching, dam oling va 24 soat ichida pasaymasa shifokorga boring.";
        } else if (trimmed.includes("yo'tal") || trimmed.includes('nafas')) {
            reply = "Yo'tal va nafas olish qiyinligi nafas yo'llari infeksiyasi, alleriya yoki boshqa sabablar bo'lishi mumkin. Agar nafas olish juda qiyin bo'lsa — zudlik bilan tibbiy yordam oling.";
        } else if (trimmed.includes('qorin') || trimmed.includes("qorin og'riq") || trimmed.includes('ich')) {
            reply = "Qorin og'riq ovqat hazm qilish muammolari, gastrit yoki boshqa holat bo'lishi mumkin. Og'riq o'tkir va uzoq davom etsa yoki qon bilan birga bo'lsa — shifokorga zudlik bilan murojaat qiling.";
        } else if (trimmed.includes('charchash') || trimmed.includes('holsiz') || trimmed.includes('enerji')) {
            reply = "Doimiy charchoq anemiya, uyqu buzilishi, qalqonsimon bez muammolari yoki boshqa holat belgisi bo'lishi mumkin. Qon tahlili topshirishni tavsiya qilaman.";
        } else if (trimmed.includes("bo'g'im") || trimmed.includes('suyak') || trimmed.includes("og'riy")) {
            reply = "Bo'g'im va suyak og'riqlari artrit, tomir muammolari yoki jarohat belgisi bo'lishi mumkin. Rentgen yoki MRI tavsiya etiladi.";
        } else if (trimmed.includes('salom') || trimmed.includes('assalomu')) {
            reply = 'Assalomu alaykum! Men MedSmart AI yordamchisiman. Qanday simptom yoki savol bilan murojaat qilyapsiz?';
        } else {
            reply = `Simptomlaringizni tushundim: "${message.trim()}". Aniqroq tashxis qo'yish uchun shifokor ko'rigidan o'tishni maslahat beraman. Agar belgilar kuchaysa, zudlik bilan tibbiy yordam oling. Men sizga faqat dastlabki ma'lumot bera olaman — shifokor o'rnini bosa olmayman.`;
        }

        logger.info('[AI Ask] Mock reply generated');
        return res.json({ reply });

    } catch (error) {
        logger.error('[AI Controller] Ask endpoint error', { error: error.message });
        return res.status(500).json({ reply: "Serverda xatolik yuz berdi. Iltimos, qayta urinib ko'ring." });
    }
};

// ─── POST /api/ai/chat ────────────────────────────────────────────────────────

/**
 * Forwards user message to the Python AI service /ai/chat endpoint.
 * Accepts:  { message: string, patientId?: string }
 * Returns:  { reply: string }
 *
 * - patientId is optional context for the AI service
 * - Saves result to AIPrediction with predictionType: 'chat'
 * - Returns 503 if AI service is offline
 * - 10-second timeout
 */
exports.chatAI = async (req, res, next) => {
    try {
        const { message, patientId } = req.body;

        if (!message || typeof message !== 'string' || message.trim() === '') {
            return res.status(400).json({ reply: 'Iltimos, savol yoki simptomlaringizni kiriting.' });
        }

        const payload = { message: message.trim() };
        if (patientId) payload.patientId = patientId;

        let aiResult;
        try {
            const aiResponse = await axios.post(
                `${AI_SERVICE_URL}/ai/chat`,
                payload,
                { timeout: 10000 }
            );
            aiResult = aiResponse.data;
        } catch (aiError) {
            const isOffline = !aiError.response;
            logger.error('[AI Service] Chat endpoint failed', { error: aiError.message });

            // Save failed attempt if we have a patientId for traceability
            if (patientId) {
                await AIPrediction.create({
                    patientId,
                    predictionType: 'chat',
                    inputData: payload,
                    resultData: { error: aiError.message },
                    riskLevel: 'Unknown',
                    aiServiceStatus: 'error'
                }).catch(() => {}); // non-fatal
            }

            return res.status(503).json({
                message: isOffline
                    ? 'AI service is offline. Please start the Python AI service on port 8000.'
                    : 'AI service returned an error.',
                detail: aiError.response ? aiError.response.data : aiError.message
            });
        }

        // Optionally persist chat result for patients
        if (patientId) {
            await AIPrediction.create({
                patientId,
                predictionType: 'chat',
                inputData: payload,
                resultData: aiResult,
                riskLevel: 'Unknown',
                aiServiceStatus: 'success'
            }).catch(err => logger.warn('Failed to persist chat result', { error: err.message }));
        }

        logger.info('[AI Chat] Message forwarded to AI service', { patientId: patientId || 'anonymous' });
        return res.json(aiResult);

    } catch (error) {
        logger.error('[AI Controller] Chat endpoint error', { error: error.message });
        next(error);
    }
};
