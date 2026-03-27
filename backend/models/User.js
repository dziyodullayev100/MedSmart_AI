/**
 * User.js — Module A: System Auth Users
 * Roles: admin | doctor | patient
 * - Soft delete only (isActive = false)
 * - bcrypt password via beforeSave hook
 * - JWT + RefreshToken pattern
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: { notEmpty: true }
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('admin', 'doctor', 'patient'),
        allowNull: false,
        defaultValue: 'patient'
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    lastLogin: {
        type: DataTypes.DATE,
        allowNull: true
    },
    resetPasswordToken: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    resetPasswordExpires: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'Users',
    indexes: [
        { unique: true, fields: ['email'] },
        { fields: ['role'] },
        { fields: ['isActive'] }
    ],
    hooks: {
        beforeSave: async (user) => {
            if (user.changed('password')) {
                user.password = await bcrypt.hash(user.password, 12);
            }
        }
    }
});

/**
 * Instance method: validate password on login
 */
User.prototype.validatePassword = async function (plain) {
    return bcrypt.compare(plain, this.password);
};

module.exports = User;
