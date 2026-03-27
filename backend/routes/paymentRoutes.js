/**
 * paymentRoutes.js — Module F: CRUD Routes
 */
const express = require('express');
const router  = express.Router();
const { protect, requireRole } = require('../middlewares/authMiddleware');
const {
    listPayments,
    getPatientPayments,
    createPayment,
    updatePayment
} = require('../controllers/paymentController');

router.get('/',            protect, requireRole('admin'), listPayments);
router.get('/patient/:id', protect, getPatientPayments);
router.post('/',           protect, createPayment);
router.put('/:id',         protect, requireRole('admin', 'doctor'), updatePayment);

module.exports = router;
