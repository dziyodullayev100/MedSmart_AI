const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Payment = sequelize.define('Payment', {
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    paymentMethod: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM("kutilmoqda", "tekshirilmoqda", "to'langan", "bekor qilingan"),
        defaultValue: "kutilmoqda"
    },
    receiptId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    paymentDate: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    indexes: [
        { fields: ['appointmentId'] },
        { fields: ['patientId'] }
    ]
});

module.exports = Payment;
