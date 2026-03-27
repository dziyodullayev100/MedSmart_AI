/**
 * paymentController.js — Module F: CRUD API
 * GET /api/payments              — list all (admin)
 * GET /api/payments/patient/:id  — patient payments
 * POST /api/payments             — create
 * PUT /api/payments/:id          — update status
 */
const { Op } = require('sequelize');
const Payment     = require('../models/Payment');
const Patient     = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Service     = require('../models/Service');

// GET /api/payments
exports.listPayments = async (req, res) => {
    try {
        const { status, method, page = 1, limit = 20 } = req.query;
        const where = {};
        if (status) where.status = status;
        if (method) where.paymentMethod = method;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const { count, rows } = await Payment.findAndCountAll({
            where,
            include: [
                { model: Patient,     as: 'patient',     attributes: ['id', 'name', 'phone'] },
                { model: Service,     as: 'service',     attributes: ['id', 'name'] },
                { model: Appointment, as: 'appointment', attributes: ['id', 'appointmentDate', 'appointmentTime'] }
            ],
            limit: parseInt(limit),
            offset,
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, total: count, page: parseInt(page), data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/payments/patient/:id
exports.getPatientPayments = async (req, res) => {
    try {
        const payments = await Payment.findAll({
            where: { patientId: req.params.id },
            include: [
                { model: Service,     as: 'service',     attributes: ['id', 'name'] },
                { model: Appointment, as: 'appointment', attributes: ['id', 'appointmentDate', 'status'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, count: payments.length, data: payments });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/payments
exports.createPayment = async (req, res) => {
    try {
        const payment = await Payment.create(req.body);
        res.status(201).json({ success: true, data: payment });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// PUT /api/payments/:id
exports.updatePayment = async (req, res) => {
    try {
        const payment = await Payment.findByPk(req.params.id);
        if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
        if (req.body.status === 'paid' && !payment.paidAt) {
            req.body.paidAt = new Date();
        }
        await payment.update(req.body);
        res.json({ success: true, data: payment });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
