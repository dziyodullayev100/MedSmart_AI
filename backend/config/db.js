const { Sequelize } = require('sequelize');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'database.sqlite');
require('dotenv').config();

let sequelize;

if (process.env.DATABASE_URL) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        logging: false
    });
} else {
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: dbPath,
        logging: false // Disable console logging for SQL queries
    });
}

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Local SQLite Database Connected');
    } catch (err) {
        console.error(`Error connecting to SQLite DB: ${err.message}`);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
