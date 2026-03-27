/**
 * RiskScore.js — Module D: AI Database
 * One record per patient (UNIQUE patientId). Updated in-place.
 * trend: improving / stable / worsening
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const RiskScore = sequelize.define('RiskScore', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    patientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'Patients', key: 'id' }
    },
    overallRisk: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0, max: 100 }
    },
    cardiovascularRisk: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        validate: { min: 0, max: 100 }
    },
    diabetesRisk: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        validate: { min: 0, max: 100 }
    },
    respiratoryRisk: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        validate: { min: 0, max: 100 }
    },
    neurologicalRisk: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
        validate: { min: 0, max: 100 }
    },
    lastCalculated: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    calculationBasis: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'JSON of what data was used: vitals counts, history flags, etc.'
    },
    trend: {
        type: DataTypes.ENUM('improving', 'stable', 'worsening'),
        allowNull: true,
        defaultValue: 'stable'
    }
}, {
    timestamps: true,
    tableName: 'RiskScores',
    indexes: [
        { unique: true, fields: ['patientId'] },
        { fields: ['overallRisk'] },
        { fields: ['lastCalculated'] },
        { fields: ['trend'] }
    ]
});

module.exports = RiskScore;
