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
                { timeout: 10000 }  // 10 second timeout
            );
            aiResult = aiResponse.data;
        } catch (aiError) {
            aiStatus = 'error';
            const isOffline = !aiError.response;
            console.error('[AI Service] Seasonal prediction failed:', aiError.message);

            // Save failed attempt for observability
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

        console.log(`[AI] Seasonal prediction stored for patient ${patientId} — risk: ${riskLevel}`);

        // ── 9. Return result ─────────────────────────────────────────────
        res.json(aiResult);

    } catch (error) {
        console.error('[AI Controller] Seasonal prediction error:', error.message);
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

        // ── 2. Fetch full diagnosis timeline (chronological for progression) ──
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
            bloodPressure: vitals[0].bloodPressure,
            heartRate: vitals[0].heartRate,
            temperature: vitals[0].temperature,
            oxygenSaturation: vitals[0].oxygenSaturation,
            weight: vitals[0].weight,
            recordedAt: vitals[0].recordedAt
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
            console.error('[AI Service] Disease progression failed:', aiError.message);

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

        console.log(`[AI] Progression analysis stored for patient ${patientId} — risk level: ${riskLevel}`);

        // ── 9. Return result ─────────────────────────────────────────────
        res.json(aiResult);

    } catch (error) {
        console.error('[AI Controller] Disease progression error:', error.message);
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

        // Validate patient exists
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
        console.error('[AI Controller] Get predictions error:', error.message);
        next(error);
    }
};
