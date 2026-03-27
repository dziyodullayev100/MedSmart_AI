/**
 * historyController.js — Module F: CRUD API (AI Critical)
 * GET /api/history/patient/:id — full history
 * POST /api/history            — add entry
 * PUT /api/history/:id         — update entry
 * DELETE /api/history/:id      — delete entry
 */
const PatientHistory = require('../models/PatientHistory');

// GET /api/history/patient/:id
exports.getPatientHistory = async (req, res) => {
    try {
        const history = await PatientHistory.findAll({
            where: { patientId: req.params.id },
            order: [['recordedAt', 'DESC']]
        });
        res.json({ success: true, count: history.length, data: history });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/history
exports.createHistory = async (req, res) => {
    try {
        const entry = await PatientHistory.create({
            ...req.body,
            recordedBy: req.user?.id,
            recordedAt: new Date()
        });
        res.status(201).json({ success: true, data: entry });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// PUT /api/history/:id
exports.updateHistory = async (req, res) => {
    try {
        const entry = await PatientHistory.findByPk(req.params.id);
        if (!entry) return res.status(404).json({ success: false, message: 'History record not found' });
        await entry.update(req.body);
        res.json({ success: true, data: entry });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// DELETE /api/history/:id
exports.deleteHistory = async (req, res) => {
    try {
        const entry = await PatientHistory.findByPk(req.params.id);
        if (!entry) return res.status(404).json({ success: false, message: 'History record not found' });
        await entry.destroy();
        res.json({ success: true, message: 'History record deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
