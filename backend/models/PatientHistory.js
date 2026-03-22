const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PatientHistory = sequelize.define('PatientHistory', {
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
    pastConditions: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    chronicConditions: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
        // e.g., ["diabetes", "hypertension"] — structured for AI queries
    },
    surgeries: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    allergies: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    medications: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
        // e.g., [{ name: "Metformin", dose: "500mg", frequency: "2x/day" }]
    },
    familyHistory: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    recordedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
        // Explicit time-based tracking for AI trend analysis
    }
}, {
    timestamps: true,  // Adds createdAt and updatedAt automatically
    indexes: [{ fields: ['patientId'] }]
});

// Define associations
PatientHistory.associate = (models) => {
    PatientHistory.belongsTo(models.Patient, { foreignKey: 'patientId' });
};

module.exports = PatientHistory;
