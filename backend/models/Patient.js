/**
 * Patient.js — Module B: Clinic Database
 * Optional userId link to User table for shared auth system.
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

const Patient = sequelize.define('Patient', {
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
    dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    age: {
        type: DataTypes.VIRTUAL,
        get() {
            if (!this.dateOfBirth) return null;
            const dob = new Date(this.dateOfBirth);
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const m = today.getMonth() - dob.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
            return age;
        }
    },
    gender: {
        type: DataTypes.ENUM('Male', 'Female', 'Other'),
        allowNull: true
    },
    bloodType: {
        type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
        allowNull: true
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    city: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    district: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    emergencyContactName: {
        type: DataTypes.STRING(150),
        allowNull: true
    },
    emergencyContactPhone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    insuranceNumber: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    occupation: {
        type: DataTypes.STRING(150),
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    timestamps: true,
    tableName: 'Patients',
    indexes: [
        { unique: true, fields: ['email'] },
        { fields: ['gender'] },
        { fields: ['bloodType'] },
        { fields: ['isActive'] },
        { fields: ['userId'] }
    ],
    hooks: {
        beforeSave: async (patient) => {
            if (patient.changed('password')) {
                patient.password = await bcrypt.hash(patient.password, 12);
            }
        }
    }
});

Patient.prototype.validatePassword = async function (plain) {
    return bcrypt.compare(plain, this.password);
};

module.exports = Patient;
