const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'medsmart_secret_key');

            let user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
            let role = 'admin';

            if (!user) {
                user = await Patient.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
                role = 'bemor';
            }

            if (!user) {
                user = await Doctor.findByPk(decoded.id, { attributes: { exclude: ['password'] } });
                role = 'doctor';
            }

            if (!user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            req.user = user;
            req.userRole = role;

            next();
        } catch (error) {
            console.error('Auth middleware error:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };
