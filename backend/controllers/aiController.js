/**
 * aiController.js — MVP Upgraded
 *
 * All AI endpoints now:
 *  1. Use buildPatientDataForAI() for rich multi-table patient context
 *  2. Log every request/response to AILog table
 *  3. Save results to AIPrediction table
 *  4. Create Notifications when risk is High or Critical
 *  5. getDiseaseProgression also upserts RiskScore table
 *  6. Return HTTP 503 on AI offline — never crashes server
 */

const axios        = require('axios');
const Patient      = require('../models/Patient');
const AIPrediction = require('../models/AIPrediction');
const AILog        = require('../models/AILog');
const RiskScore    = require('../models/RiskScore');
const Notification = require('../models/Notification');
const logger       = require('../utils/logger');
const { buildPatientDataForAI } = require('../utils/aiDataBuilder');
const { askGemini } = require('../utils/geminiClient');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// ─── Helper: Resilient Axios POST with one retry (cold-start fix) ─────────────
async function aiPostWithRetry(endpoint, payload, retries = 1) {
    const url = `${AI_SERVICE_URL}${endpoint}`;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await axios.post(url, payload, { timeout: 25000 });
        } catch (error) {
            const isTimeout = error.code === 'ECONNABORTED' || error.message.includes('timeout');
            const isOffline = !error.response;
            if (attempt < retries && (isTimeout || isOffline)) {
                logger.warn(`[AI Service] Retrying... (${attempt + 1}/${retries})`);
                await new Promise(r => setTimeout(r, 2000));
                continue;
            }
            throw error;
        }
    }
}

// ─── Helper: current season ───────────────────────────────────────────────────
function getSeason(month) {
    if ([12, 1, 2].includes(month)) return 'Winter';
    if ([3, 4, 5].includes(month))  return 'Spring';
    if ([6, 7, 8].includes(month))  return 'Summer';
    return 'Autumn';
}

// ─── Helper: extract risk level string ───────────────────────────────────────
function extractRiskLevel(type, data) {
    try {
        if (type === 'seasonal') {
            const top = data?.['Patient Forecast']?.['Top Risks']?.[0];
            return top ? top.disease : 'Unknown';
        }
        if (type === 'progression') {
            return data?.['Patient Risk Analysis']?.['Overall Risk Level'] || 'Unknown';
        }
    } catch (_) {}
    return 'Unknown';
}

// ─── Helper: write to AILog table ─────────────────────────────────────────────
async function logAI({ patientId, endpoint, requestData, responseData, responseTimeMs, status, errorMessage }) {
    try {
        await AILog.create({ patientId, endpoint, requestData, responseData, responseTimeMs, status, errorMessage });
    } catch (e) {
        logger.warn('[AILog] Failed to write log entry', { error: e.message });
    }
}

// ─── Helper: create notification for doctor ───────────────────────────────────
async function createHighRiskNotification(patientId, patientName, riskValue, type) {
    try {
        await Notification.create({
            patientId,
            type: 'alert',
            priority: 'high',
            title: `Yuqori xavf darajasi aniqlandi`,
            message: `Bemor ${patientName} xavf darajasi yuqori: ${riskValue}/100 (${type})`,
            isRead: false
        });
        logger.info(`[AI] High-risk notification created for patient ${patientId}`);
    } catch (e) {
        logger.warn('[AI] Failed to create notification', { error: e.message });
    }
}

// ─── POST /api/ai/seasonal-prediction ─────────────────────────────────────────
exports.getSeasonalPrediction = async (req, res, next) => {
    const startTime = Date.now();
    try {
        const { patientId } = req.body;
        if (!patientId) return res.status(400).json({ message: 'patientId is required' });

        // ── 1. Build rich patient data ────────────────────────────────────────
        let patientData;
        try {
            patientData = await buildPatientDataForAI(patientId);
        } catch (e) {
            return res.status(404).json({ message: e.message });
        }

        const month  = new Date().getMonth() + 1;
        const season = getSeason(month);

        // ── 2. Build rich AI payload ──────────────────────────────────────────
        const inputPayload = {
            patient_id:          patientData.patient.id,
            age:                 patientData.patient.age,
            month,
            season,
            previous_diseases:   patientData.currentConditions.map(c => c.disease).filter(Boolean),
            chronic_conditions:  patientData.chronicConditions || [],
            family_history:      patientData.familyHistory || [],
            lifestyle:           patientData.riskFactors || {},
            vitals_bmi:          patientData.vitals?.latest?.bmi || null,
            current_medications: patientData.currentMedications || []
        };

        // ── 3. Call AI service ────────────────────────────────────────────────
        let aiResult, aiStatus = 'success', errorMessage = null;
        try {
            const aiResponse = await aiPostWithRetry('/ai/seasonal-prediction', inputPayload);
            aiResult = aiResponse.data;
        } catch (aiError) {
            aiStatus = 'error';
            errorMessage = aiError.message;
            const responseTimeMs = Date.now() - startTime;

            await logAI({ patientId, endpoint: '/ai/seasonal-prediction', requestData: inputPayload, responseData: { error: aiError.message }, responseTimeMs, status: 'error', errorMessage });
            await AIPrediction.create({ patientId, predictionType: 'seasonal', inputData: inputPayload, resultData: { error: aiError.message }, riskLevel: 'Unknown', aiServiceStatus: 'error' });

            const isTimeout = aiError.code === 'ECONNABORTED' || aiError.message.includes('timeout');
            return res.status(503).json({
                message: isTimeout ? 'AI xizmati band (timeout). Birozdan so\'ng urinib ko\'ring.' : !aiError.response ? 'AI xizmati o\'chiq.' : 'AI xizmatidan xatolik.',
                detail: aiError.response ? aiError.response.data : aiError.message
            });
        }

        const responseTimeMs = Date.now() - startTime;

        // ── 4. Log to AILog ───────────────────────────────────────────────────
        await logAI({ patientId, endpoint: '/ai/seasonal-prediction', requestData: inputPayload, responseData: aiResult, responseTimeMs, status: 'success' });

        // ── 5. Save to AIPrediction ───────────────────────────────────────────
        const riskLevel = extractRiskLevel('seasonal', aiResult);
        await AIPrediction.create({ patientId, predictionType: 'seasonal', inputData: inputPayload, resultData: aiResult, riskLevel, aiServiceStatus: 'success' });

        // ── 6. Notify if risk is high ─────────────────────────────────────────
        const topRisk = aiResult?.['Patient Forecast']?.['Top Risks']?.[0];
        if (topRisk && topRisk.risk >= 75) {
            await createHighRiskNotification(patientId, patientData.patient.name, topRisk.risk, 'Seasonal');
        }

        logger.info(`[AI] Seasonal prediction stored`, { patientId, riskLevel, responseTimeMs });
        res.json({ ...aiResult, _meta: { responseTimeMs, patientName: patientData.patient.name } });

    } catch (error) {
        logger.error('[AI Controller] Seasonal prediction error', { error: error.message });
        next(error);
    }
};

// ─── POST /api/ai/disease-progression ─────────────────────────────────────────
exports.getDiseaseProgression = async (req, res, next) => {
    const startTime = Date.now();
    try {
        const { patientId } = req.body;
        if (!patientId) return res.status(400).json({ message: 'patientId is required' });

        // ── 1. Build rich patient data ────────────────────────────────────────
        let patientData;
        try {
            patientData = await buildPatientDataForAI(patientId);
        } catch (e) {
            return res.status(404).json({ message: e.message });
        }

        // ── 2. Build rich AI payload for progression ──────────────────────────
        const inputPayload = {
            patient_id:         patientData.patient.id,
            history:            patientData.currentConditions.map(c => ({
                disease:  c.disease,
                severity: c.severity,
                status:   c.status,
                date:     c.dateDiagnosed
            })),
            vitals:             patientData.vitals?.latest || null,
            chronic_conditions: patientData.chronicConditions || [],
            family_history:     patientData.familyHistory || [],
            lifestyle:          patientData.riskFactors || {},
            past_surgeries:     patientData.history || [],
            allergies:          patientData.allergies || []
        };

        // ── 3. Call AI service ────────────────────────────────────────────────
        let aiResult, aiStatus = 'success';
        try {
            const aiResponse = await aiPostWithRetry('/ai/disease-progression', inputPayload);
            aiResult = aiResponse.data;
        } catch (aiError) {
            aiStatus = 'error';
            const responseTimeMs = Date.now() - startTime;

            await logAI({ patientId, endpoint: '/ai/disease-progression', requestData: inputPayload, responseData: { error: aiError.message }, responseTimeMs, status: 'error', errorMessage: aiError.message });
            await AIPrediction.create({ patientId, predictionType: 'progression', inputData: inputPayload, resultData: { error: aiError.message }, riskLevel: 'Unknown', aiServiceStatus: 'error' });

            const isTimeout = aiError.code === 'ECONNABORTED' || aiError.message.includes('timeout');
            return res.status(503).json({
                message: isTimeout ? 'AI xizmati band (timeout). Birozdan so\'ng urinib ko\'ring.' : !aiError.response ? 'AI xizmati o\'chiq.' : 'AI xizmatidan xatolik.',
                detail: aiError.response ? aiError.response.data : aiError.message
            });
        }

        const responseTimeMs = Date.now() - startTime;

        // ── 4. Log to AILog ───────────────────────────────────────────────────
        await logAI({ patientId, endpoint: '/ai/disease-progression', requestData: inputPayload, responseData: aiResult, responseTimeMs, status: 'success' });

        // ── 5. Save to AIPrediction ───────────────────────────────────────────
        const riskLevel = extractRiskLevel('progression', aiResult);
        await AIPrediction.create({ patientId, predictionType: 'progression', inputData: inputPayload, resultData: aiResult, riskLevel, aiServiceStatus: 'success' });

        // ── 6. Upsert RiskScore ───────────────────────────────────────────────
        try {
            const analysis = aiResult?.['Patient Risk Analysis'];
            const overallRiskText = analysis?.['Overall Risk Level'] || 'Low';
            const overallRisk = overallRiskText === 'High' ? 88 : overallRiskText === 'Moderate' ? 55 : 25;

            // Check existing score to determine trend
            const existing = await RiskScore.findOne({ where: { patientId } });
            let trend = 'stable';
            if (existing) {
                if (overallRisk > existing.overallRisk + 5) trend = 'worsening';
                else if (overallRisk < existing.overallRisk - 5) trend = 'improving';
            }

            await RiskScore.upsert({
                patientId,
                overallRisk,
                cardiovascularRisk: patientData.currentConditions.some(c => /heart|cardiac|cardio/i.test(c.disease)) ? Math.min(overallRisk + 10, 100) : overallRisk,
                diabetesRisk:       patientData.chronicConditions?.some(c => /diabetes|diabet/i.test(c)) ? Math.min(overallRisk + 5, 100) : Math.max(overallRisk - 10, 0),
                respiratoryRisk:    patientData.riskFactors?.smoking === 'current' ? Math.min(overallRisk + 15, 100) : Math.max(overallRisk - 15, 0),
                lastCalculated:     new Date(),
                trend,
                calculationBasis:   { source: 'ai-progression', conditionsCount: patientData.currentConditions.length }
            });
            logger.info(`[AI] RiskScore upserted`, { patientId, overallRisk, trend });
        } catch (rsErr) {
            logger.warn('[AI] RiskScore upsert failed', { error: rsErr.message });
        }

        // ── 7. Notify if overall risk > 70 ───────────────────────────────────
        const riskText = aiResult?.['Patient Risk Analysis']?.['Overall Risk Level'];
        if (riskText === 'High' || riskText === 'Critical') {
            await createHighRiskNotification(patientId, patientData.patient.name, patientData.currentRiskScore?.overall || 88, 'Progression');
        }

        logger.info(`[AI] Progression analysis stored`, { patientId, riskLevel, responseTimeMs });
        res.json({ ...aiResult, _meta: { responseTimeMs, patientName: patientData.patient.name } });

    } catch (error) {
        logger.error('[AI Controller] Disease progression error', { error: error.message });
        next(error);
    }
};

// ─── POST /api/ai/chat (Gemini Backend Integration) ────────────────────────
const chatSessions = new Map();

exports.chatWithGemini = async (req, res, next) => {
    const startTime = Date.now();
    try {
        const { message, session_id, patientId } = req.body;

        if (!message || typeof message !== 'string' || message.trim() === '') {
            return res.status(400).json({ reply: 'Iltimos, savol yoki matn kiriting.' });
        }

        const sid = session_id || 'default_session';
        if (!chatSessions.has(sid)) {
            chatSessions.set(sid, []);
        }
        
        const history = chatSessions.get(sid);

        // Call Gemini Native Integration
        const result = await askGemini(message, history);

        // Update session tracking logic: Keep Max 10 messages
        history.push({ role: 'user', parts: [{ text: message }] });
        history.push({ role: 'model', parts: [{ text: result.reply }] });
        
        if (history.length > 10) {
            history.splice(0, history.length - 10);
        }

        const responseTimeMs = Date.now() - startTime;

        // Optionally Log to DB if patient logged in
        if (patientId) {
            await logAI({ patientId, endpoint: '/api/ai/chat', requestData: { message, session_id }, responseData: result, responseTimeMs, status: 'success' });
            await AIPrediction.create({ patientId, predictionType: 'chat', inputData: { message }, resultData: result, riskLevel: 'Unknown', aiServiceStatus: 'success' }).catch(e => logger.warn('Chat persist failed', { error: e.message }));
        }

        logger.info('[AI Chat] Response from Gemini', { session_id, responseTimeMs });
        return res.json({ ...result, _meta: { responseTimeMs } });

    } catch (error) {
        logger.error('[AI chatWithGemini] Error', { error: error.message });
        res.status(500).json({ reply: "Kechirasiz, AI xizmati vaqtincha ishlamayapti. Qayta urinib ko'ring." });
    }
};

// ─── GET /api/ai/predictions/:patientId ───────────────────────────────────────
exports.getPatientPredictions = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const patient = await Patient.findByPk(patientId, { attributes: ['id', 'name'] });
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        const predictions = await AIPrediction.findAll({
            where: { patientId },
            attributes: ['id', 'predictionType', 'riskLevel', 'aiServiceStatus', 'resultData', 'inputData', 'createdAt'],
            order: [['createdAt', 'DESC']]
        });

        res.json({ patientId, patientName: patient.name, totalPredictions: predictions.length, predictions });
    } catch (error) {
        logger.error('[AI Controller] Get predictions error', { error: error.message });
        next(error);
    }
};

// ─── POST /api/ai/triage ─────────────────────────────────────────────────────
/**
 * Forwards triage request to Python AI service /ai/triage.
 * Public endpoint — no auth required.
 * Accepts: { symptoms, age, duration_days, severity }
 */
exports.triageAI = async (req, res, next) => {
    const startTime = Date.now();
    try {
        const { symptoms, age, duration_days, severity } = req.body;
        if (!symptoms || !age || duration_days === undefined || !severity) {
            return res.status(400).json({ message: 'symptoms, age, duration_days, and severity are required' });
        }

        const payload = { symptoms, age, duration_days, severity };
        let aiResult;
        try {
            const aiResponse = await aiPostWithRetry('/ai/triage', payload);
            aiResult = aiResponse.data;
        } catch (aiError) {
            const isTimeout = aiError.code === 'ECONNABORTED' || aiError.message.includes('timeout');
            return res.status(503).json({
                message: isTimeout ? 'AI xizmati band (timeout).' : 'AI xizmati o\'chiq.',
                detail: aiError.response ? aiError.response.data : aiError.message
            });
        }

        const responseTimeMs = Date.now() - startTime;
        logger.info('[AI Triage] Triage completed', { responseTimeMs, level: aiResult?.triage_level });
        return res.json({ ...aiResult, _meta: { responseTimeMs } });
    } catch (error) {
        logger.error('[AI Controller] Triage error', { error: error.message });
        next(error);
    }
};

exports.askAI = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || typeof message !== 'string' || message.trim() === '') {
            return res.status(400).json({ reply: 'Iltimos, savol yoki simptomlaringizni kiriting.' });
        }
        const t = message.trim().toLowerCase();
        let reply;
        if (t.includes('bosh') || t.includes("bosh og'riq"))
            reply = "Bosh og'riq ko'p sababli: stress, uyqu yetishmasligi, qon bosimi. Uzoq davom etsa, shifokorga murojaat qiling.";
        else if (t.includes('harorat') || t.includes('isitma'))
            reply = "38°C dan yuqori harorat — infeksion kasallik belgisi. Ko'p suv iching va shifokorga boring.";
        else if (t.includes("yo'tal") || t.includes('nafas'))
            reply = "Nafas qiyinligi — zudlik bilan tibbiy yordam oling.";
        else if (t.includes('salom') || t.includes('assalomu'))
            reply = 'Assalomu alaykum! MedSmart AI yordamchisiman. Qanday savol?';
        else
            reply = `Simptomlaringizni tushundim: "${message.trim()}". Aniqroq tashxis uchun shifokorga murojaat qiling.`;

        return res.json({ reply });
    } catch (error) {
        return res.status(500).json({ reply: "Serverda xatolik yuz berdi." });
    }
};
