const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AILog = sequelize.define('AILog', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    patientId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Patients', key: 'id' }
    },
    endpoint: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'e.g. "/predict/seasonal"'
    },
    requestData: {
        type: DataTypes.JSON,
        allowNull: true
    },
    responseData: {
        type: DataTypes.JSON,
        allowNull: true
    },
    responseTimeMs: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Response time in milliseconds',
        validate: { min: 0 }
    },
    status: {
        type: DataTypes.ENUM('success', 'error'),
        allowNull: false,
        defaultValue: 'success'
    },
    errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true,
    updatedAt: false,   // Logs are append-only; no updatedAt needed
    tableName: 'AILogs',
    indexes: [
        { fields: ['patientId'] },
        { fields: ['endpoint'] },
        { fields: ['status'] },
        { fields: ['createdAt'] }
    ]
});

module.exports = AILog;
