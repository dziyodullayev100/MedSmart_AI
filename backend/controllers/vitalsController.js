/**
 * vitalsController.js — Module F: CRUD API
 * GET /api/vitals/patient/:id — history
 * POST /api/vitals            — record new
 * PUT /api/vitals/:id         — update
 */
const VitalSigns = require('../models/VitalSigns');
const Doctor     = require('../models/Doctor');

// GET /api/vitals/patient/:id
exports.getPatientVitals = async (req, res) => {
    try {
        const vitals = await VitalSigns.findAll({
            where: { patientId: req.params.id },
            include: [{ model: Doctor, as: 'doctor', attributes: ['id', 'name', 'specialization'] }],
            order: [['recordedAt', 'DESC']],
            limit: 50
        });
        res.json({ success: true, count: vitals.length, data: vitals });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/vitals
exports.createVitalSigns = async (req, res) => {
    try {
        // BMI auto-calculated by model hook
        const vitals = await VitalSigns.create(req.body);
        res.status(201).json({ success: true, data: vitals });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// PUT /api/vitals/:id
exports.updateVitalSigns = async (req, res) => {
    try {
        const vitals = await VitalSigns.findByPk(req.params.id);
        if (!vitals) return res.status(404).json({ success: false, message: 'Vitals record not found' });
        await vitals.update(req.body);
        res.json({ success: true, data: vitals });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
