const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const dbPath = path.join(__dirname, '..', 'data', 'database.sqlite');
const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;

// Debugging logs to verify environment variables at startup
console.log('--- Database Configuration Check ---');
console.log(`NODE_ENV configured as: ${process.env.NODE_ENV || 'NOT SET (Defaults to development)'}`);
console.log(`DATABASE_URL is provided: ${!!databaseUrl}`); // Boolean check for security

let sequelize;

if (isProduction || databaseUrl) {
    // If in production, ensure DATABASE_URL is available
    if (!databaseUrl) {
        console.error('CRITICAL ERROR: NODE_ENV is set to "production" but DATABASE_URL is missing!');
        console.error('ACTION REQUIRED: Please add you Internal Database URL as DATABASE_URL in the Render Environment tab.');
        process.exit(1); // Stops the server, strictly preventing standard SQLite fallback!
    }

    console.log('Initializing PostgreSQL connection using DATABASE_URL...');
    sequelize = new Sequelize(databaseUrl, {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false // Required by Render for hosted Postgres
            }
        },
        logging: false // Switch to `console.log` if you need to trace raw SQL queries
    });
} else {
    console.warn('WARNING: Running in development mode using local SQLite.');
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: dbPath,
        logging: false
    });
}

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        const activeDialect = sequelize.options.dialect;
        console.log(`✅ SUCCESS: Connected to the database! Active Dialect: [${activeDialect.toUpperCase()}]`);
    } catch (err) {
        console.error('❌ ERROR: Could not connect to the database.');
        console.error(`Details: ${err.message}`);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
