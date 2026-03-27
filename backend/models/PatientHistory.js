/**
 * PatientHistory.js — Module C: ⭐ AI CRITICAL TABLE
 *
 * This is the PRIMARY input table for the AI diagnostic service.
 * The AI reads:
 *   diseaseName, symptoms, chronicConditions, currentMedications,
 *   allergies, familyHistory, smokingStatus, alcoholUse, exerciseFrequency
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PatientHistory = sequelize.define('PatientHistory', {
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

    // ── Disease history (AI reads this) ──────────────────────────────────────
    diseaseName: {
        type: DataTypes.STRING(500),
        allowNull: false,
        comment: '⭐ AI reads — disease / condition name'
    },
    symptoms: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '⭐ AI reads — comma-separated symptom list'
    },
    treatment: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    endDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'NULL if still ongoing'
    },
    isOngoing: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    severity: {
        type: DataTypes.ENUM('mild', 'moderate', 'severe', 'critical'),
        allowNull: false,
        defaultValue: 'moderate'
    },
    outcome: {
        type: DataTypes.ENUM('recovered', 'chronic', 'worsened', 'unknown'),
        allowNull: false,
        defaultValue: 'unknown'
    },

    // ── Chronic conditions (AI reads this) ────────────────────────────────────
    chronicConditions: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '⭐ AI reads — e.g. "Diabetes, Hypertension"'
    },

    // ── Medications (AI reads this) ───────────────────────────────────────────
    currentMedications: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '⭐ AI reads — e.g. "Metformin 500mg, Lisinopril 10mg"'
    },
    pastMedications: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Previously used medications'
    },

    // ── Allergies (AI reads this) ─────────────────────────────────────────────
    allergies: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '⭐ AI reads — e.g. "Penicillin, Aspirin"'
    },

    // ── Surgeries ────────────────────────────────────────────────────────────
    pastSurgeries: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'e.g. "Appendectomy 2019, ACL repair 2021"'
    },

    // ── Family history (AI reads this) ────────────────────────────────────────
    familyHistory: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '⭐ AI reads — e.g. "Father: Diabetes, Mother: Hypertension"'
    },

    // ── Lifestyle risk factors (AI inputs) ────────────────────────────────────
    smokingStatus: {
        type: DataTypes.ENUM('never', 'former', 'current'),
        allowNull: true
    },
    alcoholUse: {
        type: DataTypes.ENUM('none', 'occasional', 'moderate', 'heavy'),
        allowNull: true
    },
    exerciseFrequency: {
        type: DataTypes.ENUM('none', 'rarely', 'weekly', 'daily'),
        allowNull: true
    },
    dietType: {
        type: DataTypes.ENUM('normal', 'vegetarian', 'diabetic', 'cardiac'),
        allowNull: true,
        defaultValue: 'normal'
    },

    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    recordedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'doctorId who recorded this entry'
    },
    recordedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true,
    tableName: 'PatientHistories',
    indexes: [
        { fields: ['patientId'] },
        { fields: ['isOngoing'] },
        { fields: ['severity'] },
        { fields: ['recordedAt'] },
        { fields: ['patientId', 'recordedAt'] }
    ]
});

module.exports = PatientHistory;
