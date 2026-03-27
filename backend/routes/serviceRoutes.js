/**
 * serviceRoutes.js — Module F: CRUD Routes
 */
const express = require('express');
const router  = express.Router();
const { protect, requireRole } = require('../middlewares/authMiddleware');
const {
    listServices,
    createService,
    updateService,
    deleteService
} = require('../controllers/serviceController');

router.get('/',       listServices);                                // Public
router.post('/',      protect, requireRole('admin'), createService);
router.put('/:id',    protect, requireRole('admin'), updateService);
router.delete('/:id', protect, requireRole('admin'), deleteService);

module.exports = router;
