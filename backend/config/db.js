/**
 * db.js — MedSmart Single Database Connection
 *
 * LOCAL  (default): SQLite  → backend/data/database.sqlite
 * PROD   (env set): PostgreSQL → process.env.DATABASE_URL
 *
 * Zero code changes needed to switch environments.
 */
const { Sequelize } = require('sequelize');
const path = require('path');
const fs   = require('fs');
require('dotenv').config();

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH  = path.join(DATA_DIR, 'database.sqlite');
const DB_URL   = process.env.DATABASE_URL;
const IS_PROD  = process.env.NODE_ENV === 'production';

// Auto-create data directory for SQLite
if (!DB_URL && !IS_PROD && !fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

let sequelize;

if (IS_PROD || DB_URL) {
    // ── PRODUCTION: PostgreSQL ──────────────────────────────────────────
    if (!DB_URL) {
        console.error('❌ CRITICAL: NODE_ENV=production but DATABASE_URL is not set!');
        process.exit(1);
    }
    sequelize = new Sequelize(DB_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
        logging: false
    });
    console.log('🐘  Connected to PostgreSQL: production');
} else {
    // ── DEVELOPMENT: SQLite ─────────────────────────────────────────────
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: DB_PATH,
        logging: false
    });
    console.log('✅  Connected to SQLite: backend/data/database.sqlite');
}

const connectDB = async () => {
    try {
        await sequelize.authenticate();
    } catch (err) {
        console.error('❌  Database connection failed:', err.message);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
