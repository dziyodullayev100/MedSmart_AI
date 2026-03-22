const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Diagnosis = sequelize.define('Diagnosis', {
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
    doctorId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Doctors',
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
    },
    condition: {
        type: DataTypes.STRING,
        allowNull: false
    },
    symptoms: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
        // e.g., ["fever", "cough", "fatigue"]
    },
    severity: {
        type: DataTypes.ENUM('mild', 'moderate', 'severe'),
        allowNull: true,
        defaultValue: 'mild'
    },
    dateDiagnosed: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('active', 'resolved'),
        defaultValue: 'active'
    }
}, {
    timestamps: true,  // Adds createdAt and updatedAt automatically
    indexes: [
        { fields: ['patientId'] },
        { fields: ['doctorId'] }
    ]
});

// Define associations
Diagnosis.associate = (models) => {
    Diagnosis.belongsTo(models.Patient, { foreignKey: 'patientId' });
    Diagnosis.belongsTo(models.Doctor, { foreignKey: 'doctorId' });
    Diagnosis.belongsTo(models.Appointment, { foreignKey: 'appointmentId' });
};

module.exports = Diagnosis;
