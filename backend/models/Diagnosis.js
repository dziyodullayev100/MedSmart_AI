/**
 * Diagnosis.js — Module C: Medical Database
 * Status: active / resolved / chronic / monitoring
 * Severity: mild / moderate / severe / critical
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Diagnosis = sequelize.define('Diagnosis', {
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
        allowNull: false,
        references: { model: 'Doctors', key: 'id' }
    },
    appointmentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Appointments', key: 'id' }
    },
    condition: {
        type: DataTypes.STRING(500),
        allowNull: false,
        comment: 'Disease / condition name'
    },
    icd10Code: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'ICD-10 code e.g. "J06.9"'
    },
    severity: {
        type: DataTypes.ENUM('mild', 'moderate', 'severe', 'critical'),
        allowNull: false,
        defaultValue: 'moderate'
    },
    symptoms: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Comma-separated symptom list'
    },
    treatment: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    prescription: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    dateDiagnosed: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    status: {
        type: DataTypes.ENUM('active', 'resolved', 'chronic', 'monitoring'),
        allowNull: false,
        defaultValue: 'active'
    },
    followUpRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    timestamps: true,
    tableName: 'Diagnoses',
    indexes: [
        { fields: ['patientId'] },
        { fields: ['doctorId'] },
        { fields: ['status'] },
        { fields: ['dateDiagnosed'] }
    ]
});

module.exports = Diagnosis;
