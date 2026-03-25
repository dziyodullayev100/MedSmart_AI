const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * RefreshToken
 * Stores refresh tokens issued at login.
 * Tokens are revoked on logout and automatically expire after 7 days.
 */
const RefreshToken = sequelize.define('RefreshToken', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    token: {
        type: DataTypes.STRING(512),
        allowNull: false,
        unique: true
    },
    userId: {
        type: DataTypes.STRING,   // UUID or integer depending on model
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('admin', 'bemor', 'doctor'),
        allowNull: false
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
    indexes: [
        { unique: true, fields: ['token'] },
        { fields: ['userId'] },
        { fields: ['expiresAt'] }
    ]
});

module.exports = RefreshToken;
