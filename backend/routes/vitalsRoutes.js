/**
 * vitalsRoutes.js — Module F: CRUD Routes
 */
const express = require('express');
const router  = express.Router();
const { protect, requireRole } = require('../middlewares/authMiddleware');
const {
    getPatientVitals,
    createVitalSigns,
    updateVitalSigns
} = require('../controllers/vitalsController');

router.get('/patient/:id', protect, getPatientVitals);
router.post('/',           protect, requireRole('admin', 'doctor'), createVitalSigns);
router.put('/:id',         protect, requireRole('admin', 'doctor'), updateVitalSigns);

module.exports = router;
