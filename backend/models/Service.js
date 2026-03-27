/**
 * Service.js — Module B: Clinic Services
 * Categories: consultation / laboratory / imaging / procedure / therapy
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Service = sequelize.define('Service', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: { notEmpty: true }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    category: {
        type: DataTypes.ENUM('consultation', 'laboratory', 'imaging', 'procedure', 'therapy'),
        allowNull: false,
        defaultValue: 'consultation'
    },
    price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        comment: 'Price in UZS',
        validate: { min: 0 }
    },
    duration: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Duration in minutes',
        validate: { min: 1 }
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    timestamps: true,
    tableName: 'Services',
    indexes: [
        { fields: ['category'] },
        { fields: ['isActive'] }
    ]
});

module.exports = Service;
