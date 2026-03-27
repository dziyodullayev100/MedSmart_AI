const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AIPrediction = sequelize.define('AIPrediction', {
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
    predictionType: {
        type: DataTypes.ENUM('seasonal', 'progression', 'chat', 'triage'),
        allowNull: false
    },
    inputData: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
        comment: 'Raw feature payload sent to the AI service'
    },
    resultData: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
        comment: 'Full AI service response'
    },
    riskLevel: {
        type: DataTypes.ENUM('Low', 'Moderate', 'High', 'Critical'),
        allowNull: true
    },
    confidence: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        comment: '0–100 confidence percentage',
        validate: { min: 0, max: 100 }
    },
    aiServiceStatus: {
        type: DataTypes.ENUM('success', 'error'),
        allowNull: false,
        defaultValue: 'success'
    },
    modelVersion: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'e.g. "medsmart-v2.1.0"'
    }
}, {
    timestamps: true,
    tableName: 'AIPredictions',
    indexes: [
        { fields: ['patientId'] },
        { fields: ['predictionType'] },
        { fields: ['riskLevel'] },
        { fields: ['createdAt'] }
    ]
});

module.exports = AIPrediction;
