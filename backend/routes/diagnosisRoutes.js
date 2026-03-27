/**
 * diagnosisRoutes.js — Module F: CRUD Routes
 */
const express = require('express');
const router  = express.Router();
const { protect, requireRole } = require('../middlewares/authMiddleware');
const {
    getPatientDiagnoses,
    createDiagnosis,
    updateDiagnosis,
    deleteDiagnosis
} = require('../controllers/diagnosisController');

router.get('/patient/:id', protect, getPatientDiagnoses);
router.post('/',           protect, requireRole('admin', 'doctor'), createDiagnosis);
router.put('/:id',         protect, requireRole('admin', 'doctor'), updateDiagnosis);
router.delete('/:id',      protect, requireRole('admin'), deleteDiagnosis);

module.exports = router;
