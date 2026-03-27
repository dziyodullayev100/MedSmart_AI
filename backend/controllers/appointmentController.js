/**
 * appointmentController.js — Module F: CRUD API
 * GET /api/appointments        — list (role-filtered)
 * GET /api/appointments/today  — today only
 * GET /api/appointments/:id    — single + details
 * POST /api/appointments       — create
 * PUT /api/appointments/:id    — update status/notes
 * DELETE /api/appointments/:id — cancel
 */
const { Op } = require('sequelize');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Service = require('../models/Service');
const Diagnosis = require('../models/Diagnosis');
const VitalSigns = require('../models/VitalSigns');
const Payment = require('../models/Payment');

// GET /api/appointments
exports.listAppointments = async (req, res) => {
    try {
        const { status, doctorId, patientId, date, page = 1, limit = 20 } = req.query;
        const where = {};
        if (status) where.status = status;
        if (doctorId) where.doctorId = doctorId;
        if (patientId) where.patientId = patientId;
        if (date) where.appointmentDate = date;

        // Role-based filtering
        if (req.user?.role === 'doctor') where.doctorId = req.user.id;
        if (req.user?.role === 'patient') where.patientId = req.user.id;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const { count, rows } = await Appointment.findAndCountAll({
            where,
            include: [
                { model: Patient, as: 'patient', attributes: ['id', 'name', 'phone', 'email'] },
                { model: Doctor, as: 'doctor', attributes: ['id', 'name', 'specialization'] },
                { model: Service, as: 'service', attributes: ['id', 'name', 'price', 'duration'] }
            ],
            limit: parseInt(limit),
            offset,
            order: [['appointmentDate', 'DESC'], ['appointmentTime', 'ASC']]
        });
        res.json({ success: true, total: count, page: parseInt(page), data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/appointments/today
exports.getTodayAppointments = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const where = { appointmentDate: today };
        if (req.user?.role === 'doctor') where.doctorId = req.user.id;
        if (req.user?.role === 'patient') where.patientId = req.user.id;

        const rows = await Appointment.findAll({
            where,
            include: [
                { model: Patient, as: 'patient', attributes: ['id', 'name', 'phone', 'bloodType'] },
                { model: Doctor, as: 'doctor', attributes: ['id', 'name', 'specialization'] },
                { model: Service, as: 'service', attributes: ['id', 'name', 'duration'] }
            ],
            order: [['appointmentTime', 'ASC']]
        });
        res.json({ success: true, date: today, count: rows.length, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/appointments/:id
exports.getAppointment = async (req, res) => {
    try {
        const appt = await Appointment.findByPk(req.params.id, {
            include: [
                { model: Patient, as: 'patient', attributes: { exclude: ['password'] } },
                { model: Doctor, as: 'doctor', attributes: { exclude: ['password'] } },
                { model: Service, as: 'service' },
                { model: Payment, as: 'payment' },
                { model: Diagnosis, as: 'diagnoses' },
                { model: VitalSigns, as: 'vitalSigns' }
            ]
        });
        if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });
        res.json({ success: true, data: appt });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/appointments
exports.createAppointment = async (req, res) => {
    try {
        const appt = await Appointment.create({
            ...req.body,
            createdBy: req.user?.id
        });
        res.status(201).json({ success: true, data: appt });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// PUT /api/appointments/:id
exports.updateAppointment = async (req, res) => {
    try {
        const appt = await Appointment.findByPk(req.params.id);
        if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });
        await appt.update(req.body);
        res.json({ success: true, data: appt });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// DELETE /api/appointments/:id — sets status to 'cancelled'
exports.cancelAppointment = async (req, res) => {
    try {
        const appt = await Appointment.findByPk(req.params.id);
        if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });
        await appt.update({ status: 'cancelled' });
        res.json({ success: true, message: 'Appointment cancelled' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
