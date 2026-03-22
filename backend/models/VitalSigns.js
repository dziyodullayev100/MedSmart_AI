const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const VitalSigns = sequelize.define('VitalSigns', {
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
    appointmentId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Appointments',
            key: 'id'
        }
        // Optional: link vitals to a specific visit for time-series tracking
    },
    height: {
        type: DataTypes.FLOAT, // Height in cm
        allowNull: true
    },
    weight: {
        type: DataTypes.FLOAT, // Weight in kg
        allowNull: true
    },
    bloodPressure: {
        type: DataTypes.STRING, // e.g., '120/80'
        allowNull: true
    },
    heartRate: {
        type: DataTypes.INTEGER, // bpm
        allowNull: true
    },
    temperature: {
        type: DataTypes.FLOAT, // Celsius
        allowNull: true
    },
    oxygenSaturation: {
        type: DataTypes.FLOAT, // SpO2 percentage, e.g., 98.5
        allowNull: true
    },
    recordedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
        // Explicit timestamp for time-series AI analysis
    }
}, {
    timestamps: true,  // Adds createdAt and updatedAt
    indexes: [
        { fields: ['patientId'] },
        { fields: ['appointmentId'] }
    ]
});

// Define associations
VitalSigns.associate = (models) => {
    VitalSigns.belongsTo(models.Patient, { foreignKey: 'patientId' });
    VitalSigns.belongsTo(models.Appointment, { foreignKey: 'appointmentId' });
};

module.exports = VitalSigns;
