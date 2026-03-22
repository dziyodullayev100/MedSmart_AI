const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Define the User model using Sequelize
const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt columns
});

module.exports = User;
