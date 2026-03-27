/**
 * RefreshToken.js — Module A: JWT Refresh Tokens
 * - On logout: isRevoked = true
 * - On password change: ALL tokens for userId revoked
 * - Expired tokens cleaned on request or by cron
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const RefreshToken = sequelize.define('RefreshToken', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID of the user (User, Doctor, or Patient table)'
    },
    userRole: {
        type: DataTypes.ENUM('admin', 'doctor', 'patient'),
        allowNull: false
    },
    token: {
        type: DataTypes.STRING(512),
        allowNull: false,
        unique: true
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    isRevoked: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    timestamps: true,
    updatedAt: false,
    tableName: 'RefreshTokens',
    indexes: [
        { unique: true, fields: ['token'] },
        { fields: ['userId'] },
        { fields: ['userRole'] },
        { fields: ['expiresAt'] },
        { fields: ['isRevoked'] }
    ]
});

module.exports = RefreshToken;
