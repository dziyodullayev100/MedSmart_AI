/**
 * patientController.js — Module F: CRUD API
 * GET /api/patients           — list all (admin/doctor)
 * GET /api/patients/:id       — single patient
 * GET /api/patients/:id/full  — patient + all medical data + AI
 * POST /api/patients          — create
 * PUT /api/patients/:id       — update
 * DELETE /api/patients/:id    — soft delete
 */
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const Patient       = require('../models/Patient');
const Appointment   = require('../models/Appointment');
const Diagnosis     = require('../models/Diagnosis');
const VitalSigns    = require('../models/VitalSigns');
const PatientHistory = require('../models/PatientHistory');
const AIPrediction  = require('../models/AIPrediction');
const RiskScore     = require('../models/RiskScore');
const Payment       = require('../models/Payment');
const Doctor        = require('../models/Doctor');
const Service       = require('../models/Service');

// GET /api/patients
exports.listPatients = async (req, res) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;
        const where = { isActive: true };
        if (search) {
            where[Op.or] = [
                { name:  { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { phone: { [Op.like]: `%${search}%` } }
            ];
        }
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const { count, rows } = await Patient.findAndCountAll({
            where,
            attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] },
            limit: parseInt(limit),
            offset,
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, total: count, page: parseInt(page), data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/patients/:id
exports.getPatient = async (req, res) => {
    try {
        const patient = await Patient.findByPk(req.params.id, {
            attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] }
        });
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
        res.json({ success: true, data: patient });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/patients/:id/full
exports.getPatientFull = async (req, res) => {
    try {
        const id = req.params.id;
        const patient = await Patient.findByPk(id, {
            attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] },
            include: [
                {
                    model: Appointment, as: 'appointments',
                    include: [
                        { model: Doctor, as: 'doctor', attributes: ['id', 'name', 'specialization'] },
                        { model: Service, as: 'service', attributes: ['id', 'name', 'price'] }
                    ],
                    limit: 10, order: [['appointmentDate', 'DESC']]
                },
                {
                    model: Diagnosis, as: 'diagnoses',
                    include: [{ model: Doctor, as: 'doctor', attributes: ['id', 'name', 'specialization'] }],
                    order: [['dateDiagnosed', 'DESC']]
                },
                {
                    model: VitalSigns, as: 'vitalSigns',
                    limit: 10, order: [['recordedAt', 'DESC']]
                },
                { model: PatientHistory, as: 'history', order: [['recordedAt', 'DESC']] },
                {
                    model: AIPrediction, as: 'predictions',
                    limit: 5, order: [['createdAt', 'DESC']]
                },
                { model: RiskScore, as: 'riskScore' },
                {
                    model: Payment, as: 'payments',
                    include: [{ model: Service, as: 'service', attributes: ['id', 'name'] }],
                    limit: 10, order: [['createdAt', 'DESC']]
                }
            ]
        });
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
        res.json({ success: true, data: patient });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/patients
exports.createPatient = async (req, res) => {
    try {
        const { password, ...rest } = req.body;
        if (!password) return res.status(400).json({ success: false, message: 'Password is required' });
        const hashedPassword = await bcrypt.hash(password, 12);
        const patient = await Patient.create({ ...rest, password: hashedPassword });
        const { password: _pw, ...safeData } = patient.toJSON();
        res.status(201).json({ success: true, data: safeData });
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ success: false, message: 'Email already registered' });
        }
        res.status(400).json({ success: false, message: err.message });
    }
};

// PUT /api/patients/:id
exports.updatePatient = async (req, res) => {
    try {
        const patient = await Patient.findByPk(req.params.id);
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
        // Prevent email re-use as password field
        const { password, ...updateData } = req.body;
        if (password) {
            updateData.password = await bcrypt.hash(password, 12);
        }
        await patient.update(updateData);
        const { password: _pw, ...safeData } = patient.toJSON();
        res.json({ success: true, data: safeData });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// DELETE /api/patients/:id  (soft delete)
exports.deletePatient = async (req, res) => {
    try {
        const patient = await Patient.findByPk(req.params.id);
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
        await patient.update({ isActive: false });
        res.json({ success: true, message: 'Patient deactivated (soft delete)' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
