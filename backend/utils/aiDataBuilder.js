/**
 * aiDataBuilder.js — Module G: AI Data Flow Builder
 *
 * Function: buildPatientDataForAI(patientId)
 * Queries ALL relevant tables and returns a structured object
 * for the AI diagnostic service. All AI endpoints MUST use this.
 *
 * Usage:
 *   const { buildPatientDataForAI } = require('../utils/aiDataBuilder');
 *   const data = await buildPatientDataForAI(patientId);
 */
const Patient        = require('../models/Patient');
const Diagnosis      = require('../models/Diagnosis');
const VitalSigns     = require('../models/VitalSigns');
const PatientHistory = require('../models/PatientHistory');
const AIPrediction   = require('../models/AIPrediction');
const RiskScore      = require('../models/RiskScore');
const Doctor         = require('../models/Doctor');

/**
 * Build comprehensive patient data payload for AI service.
 * @param {number} patientId
 * @returns {object} Structured patient data for AI
 */
const buildPatientDataForAI = async (patientId) => {
    // ── 1. Patient core ──────────────────────────────────────────────────────
    const patient = await Patient.findByPk(patientId, {
        attributes: ['id', 'name', 'dateOfBirth', 'gender', 'bloodType', 'occupation', 'city']
    });
    if (!patient) throw new Error(`Patient ${patientId} not found`);

    const age = patient.age; // VIRTUAL field computed from dateOfBirth

    // ── 2. Active diagnoses (current conditions) ─────────────────────────────
    const activeDiagnoses = await Diagnosis.findAll({
        where: { patientId, status: ['active', 'chronic', 'monitoring'] },
        attributes: ['condition', 'severity', 'status', 'dateDiagnosed', 'icd10Code', 'symptoms'],
        order: [['dateDiagnosed', 'DESC']]
    });

    // ── 3. Medical history (AI primary input) ────────────────────────────────
    const historyRecords = await PatientHistory.findAll({
        where: { patientId },
        order: [['recordedAt', 'DESC']]
    });

    // Aggregate the most recent / most comprehensive values
    let chronicConditions = [];
    let currentMedications = [];
    let allergies = [];
    let familyHistory = [];
    let smokingStatus = null;
    let alcoholUse = null;
    let exerciseFrequency = null;
    let dietType = null;

    for (const h of historyRecords) {
        if (h.chronicConditions) {
            const items = h.chronicConditions.split(',').map(s => s.trim()).filter(Boolean);
            items.forEach(i => { if (!chronicConditions.includes(i)) chronicConditions.push(i); });
        }
        if (h.currentMedications) {
            const items = h.currentMedications.split(',').map(s => s.trim()).filter(Boolean);
            items.forEach(i => { if (!currentMedications.includes(i)) currentMedications.push(i); });
        }
        if (h.allergies) {
            const items = h.allergies.split(',').map(s => s.trim()).filter(Boolean);
            items.forEach(i => { if (!allergies.includes(i)) allergies.push(i); });
        }
        if (h.familyHistory) {
            const items = h.familyHistory.split(';').map(s => s.trim()).filter(Boolean);
            items.forEach(i => { if (!familyHistory.includes(i)) familyHistory.push(i); });
        }
        if (!smokingStatus    && h.smokingStatus)     smokingStatus    = h.smokingStatus;
        if (!alcoholUse       && h.alcoholUse)        alcoholUse       = h.alcoholUse;
        if (!exerciseFrequency && h.exerciseFrequency) exerciseFrequency = h.exerciseFrequency;
        if (!dietType         && h.dietType)          dietType         = h.dietType;
    }

    // ── 4. Vital signs ───────────────────────────────────────────────────────
    const vitalsRecords = await VitalSigns.findAll({
        where: { patientId },
        order: [['recordedAt', 'DESC']],
        limit: 10
    });

    let latestVitals = null;
    if (vitalsRecords.length > 0) {
        const v = vitalsRecords[0];
        latestVitals = {
            bloodPressure:    (v.bloodPressureSystolic && v.bloodPressureDiastolic)
                               ? `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}`
                               : null,
            heartRate:        v.heartRate,
            temperature:      v.temperature ? parseFloat(v.temperature) : null,
            oxygenSaturation: v.oxygenSaturation ? parseFloat(v.oxygenSaturation) : null,
            weight:           v.weight ? parseFloat(v.weight) : null,
            height:           v.height ? parseFloat(v.height) : null,
            bmi:              v.bmi ? parseFloat(v.bmi) : null,
            glucoseLevel:     v.glucoseLevel ? parseFloat(v.glucoseLevel) : null,
            cholesterolLevel: v.cholesterolLevel ? parseFloat(v.cholesterolLevel) : null,
            recordedAt:       v.recordedAt
        };
    }

    const vitalsTrend = vitalsRecords.map(v => ({
        date:             v.recordedAt,
        bp:               (v.bloodPressureSystolic && v.bloodPressureDiastolic)
                          ? `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}`
                          : null,
        heartRate:        v.heartRate,
        bmi:              v.bmi ? parseFloat(v.bmi) : null,
        oxygenSaturation: v.oxygenSaturation ? parseFloat(v.oxygenSaturation) : null
    }));

    // ── 5. Previous AI predictions ───────────────────────────────────────────
    const previousPredictions = await AIPrediction.findAll({
        where: { patientId },
        attributes: ['predictionType', 'riskLevel', 'confidence', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit: 5
    });

    // ── 6. Current risk score ────────────────────────────────────────────────
    const riskScore = await RiskScore.findOne({ where: { patientId } });

    // ── Assemble final payload ───────────────────────────────────────────────
    return {
        patient: {
            id:        patient.id,
            name:      patient.name,
            age:       age,
            gender:    patient.gender,
            bloodType: patient.bloodType,
            occupation: patient.occupation,
            city:      patient.city
        },
        currentConditions: activeDiagnoses.map(d => ({
            disease:       d.condition,
            severity:      d.severity,
            status:        d.status,
            icd10Code:     d.icd10Code,
            dateDiagnosed: d.dateDiagnosed,
            symptoms:      d.symptoms
        })),
        history: historyRecords.map(h => ({
            diseaseName:  h.diseaseName,
            symptoms:     h.symptoms,
            treatment:    h.treatment,
            startDate:    h.startDate,
            endDate:      h.endDate,
            isOngoing:    h.isOngoing,
            severity:     h.severity,
            outcome:      h.outcome
        })),
        vitals: {
            latest: latestVitals,
            trend:  vitalsTrend
        },
        riskFactors: {
            smoking:    smokingStatus    || 'unknown',
            alcohol:    alcoholUse       || 'unknown',
            exercise:   exerciseFrequency || 'unknown',
            diet:       dietType         || 'normal',
            bmi:        latestVitals?.bmi  || null,
            age:        age
        },
        chronicConditions,
        currentMedications,
        allergies,
        familyHistory,
        previousPredictions: previousPredictions.map(p => ({
            type:       p.predictionType,
            riskLevel:  p.riskLevel,
            confidence: p.confidence ? parseFloat(p.confidence) : null,
            date:       p.createdAt
        })),
        currentRiskScore: riskScore ? {
            overall:        riskScore.overallRisk,
            cardiovascular: riskScore.cardiovascularRisk,
            diabetes:       riskScore.diabetesRisk,
            respiratory:    riskScore.respiratoryRisk,
            neurological:   riskScore.neurologicalRisk,
            trend:          riskScore.trend,
            lastCalculated: riskScore.lastCalculated
        } : null
    };
};

module.exports = { buildPatientDataForAI };
