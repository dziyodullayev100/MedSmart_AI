/**
 * appointmentRoutes.js — Module F: CRUD Routes
 */
const express = require('express');
const router  = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
    listAppointments,
    getTodayAppointments,
    getAppointment,
    createAppointment,
    updateAppointment,
    cancelAppointment
} = require('../controllers/appointmentController');

router.get('/today',  protect, getTodayAppointments);
router.get('/',       protect, listAppointments);
router.get('/:id',    protect, getAppointment);
router.post('/',      protect, createAppointment);
router.put('/:id',    protect, updateAppointment);
router.delete('/:id', protect, cancelAppointment);

module.exports = router;
