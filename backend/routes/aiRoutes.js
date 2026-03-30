const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middlewares/authMiddleware');
const { validateRequest, schemas } = require('../middlewares/validateRequest');

// POST /api/ai/seasonal-prediction  — Get seasonal disease risk for a patient
router.post('/seasonal-prediction', protect, validateRequest(schemas.seasonalPrediction), aiController.getSeasonalPrediction);

// POST /api/ai/disease-progression  — Get disease progression analysis for a patient
router.post('/disease-progression', protect, validateRequest(schemas.diseaseProgression), aiController.getDiseaseProgression);

// GET  /api/ai/predictions/:patientId — Retrieve all stored AI results for a patient
router.get('/predictions/:patientId', protect, aiController.getPatientPredictions);

// POST /api/ai/ask — Conversational AI diagnostics (mock, public)
router.post('/ask', validateRequest(schemas.aiChat), aiController.askAI);

// POST /api/ai/chat — Conversational AI forwarded to Gemini API (public)
router.post('/chat', validateRequest(schemas.aiChat), aiController.chatWithGemini);

// POST /api/ai/triage — Quick medical triage assessment (public)
router.post('/triage', aiController.triageAI);

module.exports = router;
