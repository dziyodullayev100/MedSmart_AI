/**
 * Doctor.js — Module B: Clinic Database
 * Optional userId link to User table for shared auth system.
 * workingDays and workingHours stored as JSON.
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

const Doctor = sequelize.define('Doctor', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Optional link to Users table for unified auth'
    },
    name: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: { notEmpty: true }
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    specialization: {
        type: DataTypes.STRING(150),
        allowNull: false,
        defaultValue: 'General Practitioner'
    },
    experience: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Years of experience',
        validate: { min: 0, max: 60 }
    },
    education: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    licenseNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true
    },
    consultationFee: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 150000.00,
        comment: 'Fee in UZS'
    },
    workingDays: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        comment: 'e.g. ["Monday","Tuesday","Wednesday"]'
    },
    workingHours: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: { start: '09:00', end: '17:00' },
        comment: 'e.g. { start: "09:00", end: "17:00" }'
    },
    rating: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
        defaultValue: 0.0,
        validate: { min: 0.0, max: 5.0 }
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    timestamps: true,
    tableName: 'Doctors',
    indexes: [
        { unique: true, fields: ['email'] },
        { fields: ['specialization'] },
        { fields: ['isActive'] },
        { fields: ['userId'] }
    ],
    hooks: {
        beforeSave: async (doctor) => {
            if (doctor.changed('password')) {
                doctor.password = await bcrypt.hash(doctor.password, 12);
            }
        }
    }
});

Doctor.prototype.validatePassword = async function (plain) {
    return bcrypt.compare(plain, this.password);
};

module.exports = Doctor;
