const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

const tokenBlacklist = new Set();
const blacklistToken = (token) => tokenBlacklist.add(token);

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            if (tokenBlacklist.has(token)) {
                return res.status(401).json({ success: false, message: 'Not authorized, token revoked' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'medsmart_secret_key');

            // Use role claim from JWT first to avoid unnecessary DB lookups
            const claimedRole = decoded.role || '';
            let user = null;
            let role = 'patient';

            if (claimedRole === 'admin') {
                user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
                role = 'admin';
            } else if (claimedRole === 'doctor') {
                user = await Doctor.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
                role = 'doctor';
            } else if (claimedRole === 'patient') {
                user = await Patient.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
                role = 'patient';
            } else {
                // Fallback: try all tables in order
                user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
                if (user) { role = 'admin'; }
                if (!user) {
                    user = await Doctor.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
                    if (user) role = 'doctor';
                }
                if (!user) {
                    user = await Patient.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
                    if (user) role = 'patient';
                }
            }

            if (!user) {
                return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
            }

            req.user = { ...user.toJSON(), role };
            req.userRole = role;

            next();
        } catch (error) {
            console.error('Auth middleware error:', error);
            res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.userRole)) {
            return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges' });
        }
        next();
    };
};

module.exports = { protect, requireRole, blacklistToken };
