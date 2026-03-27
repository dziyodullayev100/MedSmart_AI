/**
 * doctorRoutes.js — Module F: CRUD Routes
 */
const express = require('express');
const router  = express.Router();
const { protect, requireRole } = require('../middlewares/authMiddleware');
const {
    listDoctors,
    getDoctor,
    createDoctor,
    updateDoctor,
    deleteDoctor
} = require('../controllers/doctorController');

router.get('/',       listDoctors);                               // Public
router.get('/:id',    getDoctor);                                 // Public
router.post('/',      protect, requireRole('admin'), createDoctor);
router.put('/:id',    protect, requireRole('admin'), updateDoctor);
router.delete('/:id', protect, requireRole('admin'), deleteDoctor);

module.exports = router;
