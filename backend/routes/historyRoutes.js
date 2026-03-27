/**
 * historyRoutes.js — Module F: CRUD Routes (AI Critical)
 */
const express = require('express');
const router  = express.Router();
const { protect, requireRole } = require('../middlewares/authMiddleware');
const {
    getPatientHistory,
    createHistory,
    updateHistory,
    deleteHistory
} = require('../controllers/historyController');

router.get('/patient/:id', protect, getPatientHistory);
router.post('/',           protect, requireRole('admin', 'doctor'), createHistory);
router.put('/:id',         protect, requireRole('admin', 'doctor'), updateHistory);
router.delete('/:id',      protect, requireRole('admin'), deleteHistory);

module.exports = router;
