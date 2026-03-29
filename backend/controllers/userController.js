const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const RefreshToken = require('../models/RefreshToken');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { blacklistToken } = require('../middlewares/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'medsmart_secret_key';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

// ─── Token generators ─────────────────────────────────────────────────────────

const generateAccessToken = (id, role) => {
    return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
};

const generateRefreshToken = async (userId, role) => {
    const token = jwt.sign({ id: userId, role, type: 'refresh' }, JWT_SECRET, {
        expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d`
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    const dbRole = role === 'bemor' ? 'patient' : role;
    await RefreshToken.create({ token, userId, userRole: dbRole, expiresAt, isRevoked: false });
    return token;
};

// ─── POST /api/users/login ────────────────────────────────────────────────────

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const [user, patient, doctor] = await Promise.all([
            User.findOne({ where: { email } }),
            Patient.findOne({ where: { email } }),
            Doctor.findOne({ where: { email } })
        ]);

        let foundUser = user || patient || doctor;
        let role = user ? 'admin' : (patient ? 'bemor' : 'doctor');

        if (!foundUser) {
            return res.status(401).json({ message: "Login yoki parol noto'g'ri!" });
        }

        const isMatch = await bcrypt.compare(password, foundUser.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Login yoki parol noto'g'ri!" });
        }

        const accessToken  = generateAccessToken(foundUser.id, role);
        const refreshToken = await generateRefreshToken(foundUser.id, role);

        logger.info('User logged in', { userId: foundUser.id, role });

        return res.status(200).json({
            message: 'Muvaffaqiyatli kirish',
            id: foundUser.id,
            name: foundUser.name,
            email: foundUser.email,
            role,
            token: accessToken,        // kept for backward-compat with existing frontend
            accessToken,
            refreshToken
        });

    } catch (error) {
        logger.error('Login error', { error: error.message });
        next(error);
    }
};

// ─── POST /api/users/register ─────────────────────────────────────────────────

const register = async (req, res, next) => {
    try {
        const { name, email, password, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email and password are required' });
        }

        const userExists = await User.findOne({ where: { email } }) ||
                           await Patient.findOne({ where: { email } }) ||
                           await Doctor.findOne({ where: { email } });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: 'patient',
            phone: phone || null
        });

        const accessToken  = generateAccessToken(user.id, 'patient');
        const refreshToken = await generateRefreshToken(user.id, 'patient');

        logger.info('New user registered', { userId: user.id });

        return res.status(201).json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: 'patient',
            token: accessToken,
            accessToken,
            refreshToken
        });

    } catch (error) {
        logger.error('Register error', { error: error.message });
        next(error);
    }
};

// ─── POST /api/users/refresh-token ───────────────────────────────────────────

const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken: token } = req.body;

        if (!token) {
            return res.status(400).json({ message: 'Refresh token is required' });
        }

        // Verify JWT signature & expiry
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ message: 'Invalid or expired refresh token' });
        }

        if (decoded.type !== 'refresh') {
            return res.status(401).json({ message: 'Not a refresh token' });
        }

        // Check DB record
        const storedToken = await RefreshToken.findOne({
            where: { token, isRevoked: false }
        });

        if (!storedToken) {
            return res.status(401).json({ message: 'Refresh token revoked or not found' });
        }

        if (new Date() > new Date(storedToken.expiresAt)) {
            return res.status(401).json({ message: 'Refresh token expired' });
        }

        // Issue new access token
        const newAccessToken = generateAccessToken(decoded.id, decoded.role);

        logger.info('Access token refreshed', { userId: decoded.id, role: decoded.role });

        return res.status(200).json({ accessToken: newAccessToken, token: newAccessToken });

    } catch (error) {
        logger.error('Refresh token error', { error: error.message });
        next(error);
    }
};

// ─── POST /api/users/logout ───────────────────────────────────────────────────

const logout = async (req, res, next) => {
    try {
        const { refreshToken: token } = req.body;
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer')) {
            const accessToken = authHeader.split(' ')[1];
            if (accessToken) {
                blacklistToken(accessToken);
            }
        }

        if (!token) {
            return res.status(400).json({ message: 'Refresh token is required' });
        }

        const stored = await RefreshToken.findOne({ where: { token } });

        if (stored) {
            stored.isRevoked = true;
            await stored.save();
            logger.info('User logged out, refresh token revoked', { userId: stored.userId });
        }

        return res.status(200).json({ message: 'Logged out successfully' });

    } catch (error) {
        logger.error('Logout error', { error: error.message });
        next(error);
    }
};

// ─── PUT /api/users/profile ───────────────────────────────────────────────────

const updateProfile = async (req, res, next) => {
    try {
        const { name, email, password, phone } = req.body;
        const userId = req.user.id;
        const role   = req.userRole;

        let userModel;
        if (role === 'admin')       userModel = User;
        else if (role === 'bemor')  userModel = Patient;
        else if (role === 'doctor') userModel = Doctor;

        if (!userModel) {
            return res.status(400).json({ message: 'Invalid token role' });
        }

        const user = await userModel.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (name)  user.name  = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (password) user.password = password;

        await user.save();

        logger.info('Profile updated', { userId, role });

        return res.status(200).json({
            id:    user.id,
            name:  user.name,
            email: user.email,
            phone: user.phone,
            role
        });

    } catch (error) {
        logger.error('Update profile error', { error: error.message });
        next(error);
    }
};

module.exports = { login, register, updateProfile, refreshToken, logout };
