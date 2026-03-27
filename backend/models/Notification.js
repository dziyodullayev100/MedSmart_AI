/**
 * Notification.js — Module D: AI Database
 * Types: appointment / payment / ai_alert / lab_result / system
 * Priority: low / medium / high / emergency
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Recipient user ID'
    },
    userRole: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: 'admin | doctor | patient'
    },
    type: {
        type: DataTypes.ENUM('appointment', 'payment', 'ai_alert', 'lab_result', 'system'),
        allowNull: false,
        defaultValue: 'system'
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'emergency'),
        allowNull: false,
        defaultValue: 'medium'
    },
    relatedId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'PK of the related entity (appointment, payment, etc.)'
    },
    relatedType: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'e.g. "appointment", "payment", "ai_prediction"'
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Auto-expire notification after this datetime'
    }
}, {
    timestamps: true,
    tableName: 'Notifications',
    indexes: [
        { fields: ['userId'] },
        { fields: ['userRole'] },
        { fields: ['type'] },
        { fields: ['isRead'] },
        { fields: ['priority'] },
        { fields: ['userId', 'isRead'] }
    ]
});

module.exports = Notification;
