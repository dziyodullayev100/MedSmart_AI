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
// Accepts: { message: string } | Returns: { reply: string }
router.post('/ask', validateRequest(schemas.aiChat), aiController.askAI);

// POST /api/ai/chat — Conversational AI forwarded to Python AI service
// Accepts: { message: string, patientId?: string } | Returns: { reply: string }
router.post('/chat', validateRequest(schemas.aiChat), aiController.chatAI);

module.exports = router;
