const express = require('express');
const router = express.Router();
const demoController = require('../controllers/demoController');
const { protect, requireRole } = require('../middlewares/authMiddleware');

// Middleware to block sensitive demo actions in strict production
router.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production' && process.env.DEMO_MODE !== 'true') {
        return res.status(403).json({ success: false, message: 'Demo mode is completely disabled in production.' });
    }
    next();
});

// Public Demo Info
router.get('/status', demoController.getStatus);
router.get('/credentials', demoController.getCredentials);
router.get('/report', demoController.getReport);

// Protected Admin Actions
router.use(protect);
router.use(requireRole('admin'));

router.post('/seed', demoController.seed);
router.delete('/reset', demoController.reset);

module.exports = router;
