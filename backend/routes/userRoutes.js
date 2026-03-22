const express = require('express');
const router = express.Router();
const { login, register, updateProfile } = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

// POST /api/users/login
router.post('/login', login);

// POST /api/users/register
router.post('/register', register);

// PUT /api/users/profile
router.put('/profile', protect, updateProfile);

module.exports = router;
