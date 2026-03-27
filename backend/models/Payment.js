/**
 * Payment.js — Module B: Clinic Payments
 * Statuses: pending / paid / overdue / refunded / cancelled
 * Methods: cash / card / transfer / insurance
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Payment = sequelize.define('Payment', {
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
    appointmentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Appointments', key: 'id' }
    },
    serviceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Services', key: 'id' }
    },
    amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0 }
    },
    currency: {
        type: DataTypes.STRING(5),
        allowNull: false,
        defaultValue: 'UZS'
    },
    status: {
        type: DataTypes.ENUM('pending', 'paid', 'overdue', 'refunded', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
    },
    paymentMethod: {
        type: DataTypes.ENUM('cash', 'card', 'transfer', 'insurance'),
        allowNull: true
    },
    transactionId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true
    },
    paidAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    discount: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Discount percentage (0-100)'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'Payments',
    indexes: [
        { fields: ['patientId'] },
        { fields: ['appointmentId'] },
        { fields: ['status'] },
        { fields: ['paidAt'] }
    ]
});

module.exports = Payment;
