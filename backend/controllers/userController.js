const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'medsmart_secret_key', {
        expiresIn: '30d',
    });
};

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
            return res.status(401).json({ message: 'Login yoki parol noto\'g\'ri!' });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, foundUser.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Login yoki parol noto\'g\'ri!' });
        }

        // Return success response with token
        res.status(200).json({
            message: 'Muvaffaqiyatli kirish',
            id: user.id,
            name: user.name,
            email: user.email,
            role: role,
            token: generateToken(user.id, role)
        });

    } catch (error) {
        console.error('Login error:', error);
        next(error);
    }
};

const register = async (req, res, next) => {
    try {
        const { name, email, password, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email and password are required' });
        }

        // Check if user exists in any table
        const userExists = await User.findOne({ where: { email } }) || 
                           await Patient.findOne({ where: { email } }) || 
                           await Doctor.findOne({ where: { email } });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create Patient by default
        const patient = await Patient.create({
            name,
            email,
            password: hashedPassword,
            phone: phone || null
        });

        res.status(201).json({
            id: patient.id,
            name: patient.name,
            email: patient.email,
            role: 'bemor',
            token: generateToken(patient.id, 'bemor')
        });

    } catch (error) {
        console.error('Register error:', error);
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const { name, email, password, phone } = req.body;
        const userId = req.user.id;
        const role = req.userRole;

        let userModel;
        if (role === 'admin') userModel = User;
        else if (role === 'bemor') userModel = Patient;
        else if (role === 'doctor') userModel = Doctor;
        
        if (!userModel) {
            return res.status(400).json({ message: 'Invalid token role' });
        }

        const user = await userModel.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (name) user.name = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();

        res.status(200).json({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: role
        });

    } catch (error) {
        console.error('Update profile error:', error);
        next(error);
    }
};

module.exports = {
    login,
    register,
    updateProfile
};
