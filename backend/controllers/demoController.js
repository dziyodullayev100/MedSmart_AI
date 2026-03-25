const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const seedDemo = require('../seed_demo');
const { sequelize } = require('../config/db');
const fs = require('fs');
const path = require('path');

exports.getStatus = async (req, res) => {
    try {
        const admin = await User.findOne({ where: { email: 'admin@medsmart.uz' } });
        res.json({
            isDemoMode: process.env.NODE_ENV !== 'production' || process.env.DEMO_MODE === 'true',
            isSeeded: !!admin,
            seededAt: admin ? admin.createdAt : null,
            counts: {
                doctors: await Doctor.count(),
                patients: await Patient.count(),
                appointments: await Appointment.count()
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.seed = async (req, res) => {
    try {
        await seedDemo(false); // pass false to avoid process.exit
        res.json({ success: true, message: 'Demo data seeded automatically' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.reset = async (req, res) => {
    try {
        // Drop and Recreate all tables
        await sequelize.drop();
        await sequelize.sync({ force: true });
        await seedDemo(false); 
        res.json({ success: true, message: 'System reset and re-seeded successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getCredentials = (req, res) => {
    res.json({
        success: true,
        credentials: [
            { role: 'Admin', email: 'admin@medsmart.uz', password: 'Demo1234!' },
            { role: 'Doctor', email: 'alisher@medsmart.uz', password: 'Demo1234!' },
            { role: 'Patient', email: 'patient1@demo.uz', password: 'Demo1234!' }
        ]
    });
};

exports.getReport = (req, res) => {
    const reportPath = path.join(__dirname, '..', 'data', 'demo_report.md');
    if (!fs.existsSync(reportPath)) {
        return res.status(404).json({ success: false, message: 'Report not generated yet. Run npm run demo:report' });
    }
    const report = fs.readFileSync(reportPath, 'utf8');
    res.type('text/markdown').send(report);
};
