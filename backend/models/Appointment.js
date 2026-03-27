/**
 * Appointment.js — Module B: Clinic Appointments
 * Status flow: scheduled → confirmed → in-progress → completed
 *              or → cancelled / no-show
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Appointment = sequelize.define('Appointment', {
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
    serviceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Services', key: 'id' }
    },
    appointmentDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    appointmentTime: {
        type: DataTypes.STRING(10),
        allowNull: false,
        comment: 'e.g. "10:30"'
    },
    status: {
        type: DataTypes.ENUM('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'),
        allowNull: false,
        defaultValue: 'scheduled'
    },
    chiefComplaint: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Why the patient came'
    },
    symptoms: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Initial reported symptoms'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Doctor notes after visit'
    },
    followUpDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Recommended follow-up appointment date'
    },
    createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'userId who created this appointment'
    }
}, {
    timestamps: true,
    tableName: 'Appointments',
    indexes: [
        { fields: ['patientId'] },
        { fields: ['doctorId'] },
        { fields: ['status'] },
        { fields: ['appointmentDate'] },
        { fields: ['doctorId', 'appointmentDate'] }
    ]
});

module.exports = Appointment;
