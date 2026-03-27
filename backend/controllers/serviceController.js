/**
 * serviceController.js — Module F: CRUD API
 * GET /api/services          — list all (public)
 * POST /api/services         — create (admin only)
 * PUT /api/services/:id      — update (admin only)
 * DELETE /api/services/:id   — soft delete (admin only)
 */
const Service = require('../models/Service');

// GET /api/services
exports.listServices = async (req, res) => {
    try {
        const { category } = req.query;
        const where = { isActive: true };
        if (category) where.category = category;
        const services = await Service.findAll({ where, order: [['category', 'ASC'], ['name', 'ASC']] });
        res.json({ success: true, count: services.length, data: services });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/services
exports.createService = async (req, res) => {
    try {
        const service = await Service.create(req.body);
        res.status(201).json({ success: true, data: service });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// PUT /api/services/:id
exports.updateService = async (req, res) => {
    try {
        const service = await Service.findByPk(req.params.id);
        if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
        await service.update(req.body);
        res.json({ success: true, data: service });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// DELETE /api/services/:id  (soft delete)
exports.deleteService = async (req, res) => {
    try {
        const service = await Service.findByPk(req.params.id);
        if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
        await service.update({ isActive: false });
        res.json({ success: true, message: 'Service deactivated (soft delete)' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
