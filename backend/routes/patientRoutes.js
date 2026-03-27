/**
 * patientRoutes.js — Module F: CRUD Routes
 */
const express = require('express');
const router  = express.Router();
const { protect, requireRole } = require('../middlewares/authMiddleware');
const {
    listPatients,
    getPatient,
    getPatientFull,
    createPatient,
    updatePatient,
    deletePatient
} = require('../controllers/patientController');

// Admin + Doctor can list patients; patients cannot browse others
router.get('/',          protect, requireRole('admin', 'doctor'), listPatients);
router.get('/:id/full',  protect, requireRole('admin', 'doctor'), getPatientFull);
router.get('/:id',       protect, getPatient);
router.post('/',         protect, requireRole('admin', 'doctor'), createPatient);
router.put('/:id',       protect, requireRole('admin', 'doctor'), updatePatient);
router.delete('/:id',    protect, requireRole('admin'), deletePatient);

module.exports = router;
