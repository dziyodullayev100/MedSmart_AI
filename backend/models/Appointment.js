const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Appointment = sequelize.define('Appointment', {
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
    date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    time: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('scheduled', 'completed', 'cancelled'),
        defaultValue: 'scheduled'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    serviceId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Services',
            key: 'id'
        }
    }
}, {
    timestamps: true,
    indexes: [
        { fields: ['patientId'] },
        { fields: ['doctorId'] },
        { fields: ['serviceId'] }
    ]
});

// Define associations
Appointment.associate = (models) => {
    Appointment.belongsTo(models.Doctor, { foreignKey: 'doctorId' });
    Appointment.belongsTo(models.Patient, { foreignKey: 'patientId' });
    Appointment.belongsTo(models.Service, { foreignKey: 'serviceId' });
};

module.exports = Appointment;
