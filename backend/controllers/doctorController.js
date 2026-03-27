/**
 * doctorController.js — Module F: CRUD API
 * GET /api/doctors           — list all (public)
 * GET /api/doctors/:id       — single + schedule
 * POST /api/doctors          — create (admin only)
 * PUT /api/doctors/:id       — update (admin only)
 * DELETE /api/doctors/:id    — soft delete (admin only)
 */
const { Op } = require('sequelize');
const bcrypt  = require('bcryptjs');
const Doctor      = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Patient     = require('../models/Patient');
const Service     = require('../models/Service');

// GET /api/doctors
exports.listDoctors = async (req, res) => {
    try {
        const { search, specialization, page = 1, limit = 20 } = req.query;
        const where = { isActive: true };
        if (search) {
            where[Op.or] = [
                { name:           { [Op.like]: `%${search}%` } },
                { specialization: { [Op.like]: `%${search}%` } }
            ];
        }
        if (specialization) where.specialization = specialization;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const { count, rows } = await Doctor.findAndCountAll({
            where,
            attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] },
            limit: parseInt(limit),
            offset,
            order: [['name', 'ASC']]
        });
        res.json({ success: true, total: count, page: parseInt(page), data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/doctors/:id
exports.getDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findByPk(req.params.id, {
            attributes: { exclude: ['password'] },
            include: [{
                model: Appointment, as: 'appointments',
                include: [{ model: Patient, as: 'patient', attributes: ['id', 'name', 'phone'] }],
                where: { appointmentDate: { [Op.gte]: new Date().toISOString().split('T')[0] } },
                required: false,
                limit: 20,
                order: [['appointmentDate', 'ASC'], ['appointmentTime', 'ASC']]
            }]
        });
        if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
        res.json({ success: true, data: doctor });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/doctors
exports.createDoctor = async (req, res) => {
    try {
        const { password, ...rest } = req.body;
        if (!password) return res.status(400).json({ success: false, message: 'Password is required' });
        const hashedPassword = await bcrypt.hash(password, 12);
        const doctor = await Doctor.create({ ...rest, password: hashedPassword });
        const { password: _pw, ...safeData } = doctor.toJSON();
        res.status(201).json({ success: true, data: safeData });
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ success: false, message: 'Email or license number already exists' });
        }
        res.status(400).json({ success: false, message: err.message });
    }
};

// PUT /api/doctors/:id
exports.updateDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findByPk(req.params.id);
        if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
        const { password, ...updateData } = req.body;
        if (password) updateData.password = await bcrypt.hash(password, 12);
        await doctor.update(updateData);
        const { password: _pw, ...safeData } = doctor.toJSON();
        res.json({ success: true, data: safeData });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// DELETE /api/doctors/:id  (soft delete)
exports.deleteDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findByPk(req.params.id);
        if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
        await doctor.update({ isActive: false });
        res.json({ success: true, message: 'Doctor deactivated (soft delete)' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
