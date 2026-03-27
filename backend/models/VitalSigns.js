/**
 * VitalSigns.js — Module C: Medical Database
 * BMI auto-calculated: weight(kg) / (height(cm)/100)^2
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const VitalSigns = sequelize.define('VitalSigns', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    patientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Patients', key: 'id' }
    },
    doctorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Doctors', key: 'id' }
    },
    appointmentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Appointments', key: 'id' }
    },
    bloodPressureSystolic: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'mmHg, e.g. 120',
        validate: { min: 50, max: 300 }
    },
    bloodPressureDiastolic: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'mmHg, e.g. 80',
        validate: { min: 20, max: 200 }
    },
    heartRate: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Beats per minute',
        validate: { min: 20, max: 300 }
    },
    temperature: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: true,
        comment: 'Celsius',
        validate: { min: 25.0, max: 45.0 }
    },
    oxygenSaturation: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'SpO2 %',
        validate: { min: 50.0, max: 100.0 }
    },
    weight: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'kg',
        validate: { min: 0.5 }
    },
    height: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'cm',
        validate: { min: 30.0 }
    },
    bmi: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Auto-calculated: weight(kg) / (height(m))^2'
    },
    glucoseLevel: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: true,
        comment: 'Blood glucose mmol/L'
    },
    cholesterolLevel: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: true,
        comment: 'Total cholesterol mmol/L'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    recordedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true,
    tableName: 'VitalSigns',
    indexes: [
        { fields: ['patientId'] },
        { fields: ['appointmentId'] },
        { fields: ['recordedAt'] },
        { fields: ['patientId', 'recordedAt'] }
    ],
    hooks: {
        beforeSave: (vitals) => {
            // Auto-calculate BMI if weight and height are provided
            if (vitals.weight && vitals.height && vitals.height > 0) {
                const hM = parseFloat(vitals.height) / 100;
                vitals.bmi = parseFloat((parseFloat(vitals.weight) / (hM * hM)).toFixed(2));
            }
        }
    }
});

module.exports = VitalSigns;
