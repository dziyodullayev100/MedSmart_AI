/**
 * diagnosisController.js — Module F: CRUD API
 * GET /api/diagnoses/patient/:id — patient diagnoses
 * POST /api/diagnoses            — create (doctor only)
 * PUT /api/diagnoses/:id         — update
 * DELETE /api/diagnoses/:id      — delete (admin only)
 */
const Diagnosis = require('../models/Diagnosis');
const Doctor    = require('../models/Doctor');
const Patient   = require('../models/Patient');

// GET /api/diagnoses/patient/:id
exports.getPatientDiagnoses = async (req, res) => {
    try {
        const diagnoses = await Diagnosis.findAll({
            where: { patientId: req.params.id },
            include: [
                { model: Doctor,  as: 'doctor',  attributes: ['id', 'name', 'specialization'] },
                { model: Patient, as: 'patient', attributes: ['id', 'name'] }
            ],
            order: [['dateDiagnosed', 'DESC']]
        });
        res.json({ success: true, count: diagnoses.length, data: diagnoses });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/diagnoses
exports.createDiagnosis = async (req, res) => {
    try {
        const diagnosis = await Diagnosis.create(req.body);
        res.status(201).json({ success: true, data: diagnosis });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// PUT /api/diagnoses/:id
exports.updateDiagnosis = async (req, res) => {
    try {
        const diagnosis = await Diagnosis.findByPk(req.params.id);
        if (!diagnosis) return res.status(404).json({ success: false, message: 'Diagnosis not found' });
        await diagnosis.update(req.body);
        res.json({ success: true, data: diagnosis });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// DELETE /api/diagnoses/:id
exports.deleteDiagnosis = async (req, res) => {
    try {
        const diagnosis = await Diagnosis.findByPk(req.params.id);
        if (!diagnosis) return res.status(404).json({ success: false, message: 'Diagnosis not found' });
        await diagnosis.destroy();
        res.json({ success: true, message: 'Diagnosis deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
