const express = require('express');
const router  = express.Router();
const { login, register, updateProfile, refreshToken, logout } = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const { validateRequest, schemas } = require('../middlewares/validateRequest');

// POST /api/users/login
router.post('/login', validateRequest(schemas.login), login);

// POST /api/users/register
router.post('/register', validateRequest(schemas.register), register);

// POST /api/users/refresh-token — issue new access token from a valid refresh token
router.post('/refresh-token', refreshToken);

// POST /api/users/logout — revoke refresh token
router.post('/logout', logout);

// PUT /api/users/profile — update authenticated user's profile
router.put('/profile', protect, updateProfile);

module.exports = router;
