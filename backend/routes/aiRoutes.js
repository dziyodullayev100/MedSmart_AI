const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middlewares/authMiddleware');

// POST /api/ai/seasonal-prediction  — Get seasonal disease risk for a patient
router.post('/seasonal-prediction', protect, aiController.getSeasonalPrediction);

// POST /api/ai/disease-progression  — Get disease progression analysis for a patient
router.post('/disease-progression', protect, aiController.getDiseaseProgression);

// GET  /api/ai/predictions/:patientId — Retrieve all stored AI results for a patient
router.get('/predictions/:patientId', protect, aiController.getPatientPredictions);

module.exports = router;
