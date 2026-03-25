const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * AIPrediction
 * Stores every AI service result so predictions are persisted in the database.
 *
 * Fields:
 *  - patientId       : FK → Patients
 *  - predictionType  : 'seasonal' | 'progression'
 *  - inputData       : JSON  – payload sent to the AI service
 *  - resultData      : JSON  – full response received from the AI service
 *  - riskLevel       : string extracted from response for quick queries
 *  - aiServiceStatus : 'success' | 'error' so we track failed attempts too
 */
const AIPrediction = sequelize.define('AIPrediction', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    patientId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Patients',
            key: 'id'
        }
    },
    predictionType: {
        type: DataTypes.ENUM('seasonal', 'progression', 'chat'),
        allowNull: false
    },
    inputData: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
        // Full payload sent to the AI service for auditing / replay
    },
    resultData: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
        // Full AI response for display / further analysis
    },
    riskLevel: {
        type: DataTypes.STRING,
        allowNull: true
        // Extracted from result: 'Low' | 'Moderate' | 'High' | top disease name
    },
    aiServiceStatus: {
        type: DataTypes.ENUM('success', 'error'),
        allowNull: false,
        defaultValue: 'success'
    }
}, {
    timestamps: true,  // Adds createdAt and updatedAt automatically
    indexes: [
        { fields: ['patientId'] },
        { fields: ['predictionType'] },
        { fields: ['createdAt'] }
    ]
});

// Association methods
AIPrediction.associate = (models) => {
    AIPrediction.belongsTo(models.Patient, { foreignKey: 'patientId' });
};

module.exports = AIPrediction;
