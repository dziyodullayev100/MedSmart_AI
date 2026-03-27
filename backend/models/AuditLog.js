/**
 * AuditLog.js — Module D: AI Database
 * Append-only compliance trail. NEVER update or delete rows.
 * Actions: CREATE / UPDATE / DELETE / LOGIN / LOGOUT / PASSWORD_CHANGE
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AuditLog = sequelize.define('AuditLog', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Actor user ID; null for system actions'
    },
    userRole: {
        type: DataTypes.STRING(30),
        allowNull: true,
        comment: 'Snapshot of role at time of action'
    },
    action: {
        type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE'),
        allowNull: false
    },
    tableName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Which table was affected'
    },
    recordId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'PK of the affected row'
    },
    oldData: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Row state BEFORE the change'
    },
    newData: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Row state AFTER the change'
    },
    ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true
    },
    userAgent: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true,
    updatedAt: false,   // Audit logs are append-only; no updatedAt
    tableName: 'AuditLogs',
    indexes: [
        { fields: ['userId'] },
        { fields: ['action'] },
        { fields: ['tableName'] },
        { fields: ['recordId'] },
        { fields: ['createdAt'] },
        { fields: ['tableName', 'recordId'] }
    ]
});

module.exports = AuditLog;
