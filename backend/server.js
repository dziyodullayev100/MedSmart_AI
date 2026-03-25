const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Load env vars first so logger + DB can read them
dotenv.config();

const logger = require('./utils/logger');
const { sequelize, connectDB } = require('./config/db');
const medSmartRoutes = require('./routes/medSmartRoutes');
const syncRoutes = require('./routes/syncRoutes');
const errorHandler = require('./middlewares/errorHandler');

// Import models to ensure they're registered with Sequelize
const Doctor = require('./models/Doctor');
const Patient = require('./models/Patient');
const Appointment = require('./models/Appointment');
const Service = require('./models/Service');
const Payment = require('./models/Payment');
const Diagnosis = require('./models/Diagnosis');
const PatientHistory = require('./models/PatientHistory');
const VitalSigns = require('./models/VitalSigns');
const AIPrediction = require('./models/AIPrediction');
const RefreshToken = require('./models/RefreshToken');
const { setupAssociations } = require('./config/associations');

// Connect to SQLite DB
connectDB();

// Setup model associations
setupAssociations();

// Automatically sync models to create tables if they don't exist
sequelize.sync().then(() => {
    logger.info('Database synchronized');
});

const { scheduleBackup } = require('./utils/backup');
scheduleBackup();

const monitor = require('./utils/monitor');
monitor.start();

const app = express();
app.use(monitor.trackRequest);

const { applyProductionConfig } = require('./config/production');
applyProductionConfig(app);

// ─── Rate limiters ────────────────────────────────────────────────────────────

/** General API: 1500 requests per 15 minutes per IP (Safe for hospital WiFi) */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests from this IP. Please try again in 15 minutes.' }
});

/** Auth endpoints: 50 requests per 15 minutes per IP (Allows full staff login) */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many login/register attempts. Please try again in 15 minutes.' }
});

/** AI endpoints: 200 requests per 15 minutes per IP */
const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'AI request limit reached. Please try again in 15 minutes.' }
});

// ─── Core middleware ──────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());

// ─── Request logging middleware ───────────────────────────────────────────────

app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('HTTP Request', {
            method: req.method,
            path: req.path,
            status: res.statusCode,
            durationMs: duration
        });
    });
    next();
});

// ─── Apply rate limiters ──────────────────────────────────────────────────────

// Auth limiter on login and register only
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);

// AI limiter on all /api/ai/* routes
app.use('/api/ai', aiLimiter);

// General limiter on all other /api/* routes
app.use('/api', generalLimiter);

// ─── Serve static frontend ────────────────────────────────────────────────────

app.use(express.static(path.join(__dirname, '../frontend')));

// ─── Mount routers ────────────────────────────────────────────────────────────

app.use('/api', medSmartRoutes);
app.use('/api/sync', syncRoutes);

const userRoutes = require('./routes/userRoutes');
const aiRoutes = require('./routes/aiRoutes');
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);

// Demo & Health Routes
const demoRoutes = require('./routes/demoRoutes');
app.use('/api/demo', demoRoutes);

const axios = require('axios');
app.get('/api/health/full', async (req, res) => {
    const health = {
        backend: 'ok',
        database: 'ok',
        ai: 'ok'
    };

    // 1. Check PostgreSQL Database Connection
    try {
        await sequelize.authenticate(); // More standard than SELECT 1
    } catch (error) {
        logger.error('[SRE Monitor] Database connection failed', error);
        health.database = 'down';
    }

    // 2. Check Python FastAPI AI Service
    try {
        const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
        // 4 sec timeout so monitoring doesn't hang indefinitely
        await axios.get(`${aiUrl}/health`, { timeout: 4000 }); 
    } catch (error) {
        logger.error('[SRE Monitor] AI Service is unreachable', error.message);
        health.ai = 'down';
    }

    // 3. Return Combined Status (503 if any dependency is down)
    const isHealthy = health.database === 'ok' && health.ai === 'ok';
    res.status(isHealthy ? 200 : 503).json(health);
});

// Admin endpoints
const { protect, requireRole } = require('./middlewares/authMiddleware');
const fs = require('fs');
app.get('/api/admin/backups', protect, requireRole('admin'), (req, res) => {
    const backupsDir = path.join(__dirname, 'data', 'backups');
    if (!fs.existsSync(backupsDir)) {
        return res.json({ success: true, backups: [] });
    }
    const files = fs.readdirSync(backupsDir)
        .filter(f => f.endsWith('.sqlite'))
        .map(f => {
            const stats = fs.statSync(path.join(backupsDir, f));
            return {
                filename: f,
                timestamp: stats.mtime,
                sizeBytes: stats.size
            };
        });
    res.json({ success: true, backups: files });
});

app.get('/api/metrics/system', protect, requireRole('admin'), (req, res) => {
    res.json({ success: true, metrics: monitor.getMetrics() });
});

// ─── Global error handler ─────────────────────────────────────────────────────

app.use(monitor.trackError);
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`, { port: PORT, env: process.env.NODE_ENV || 'development' });
});

// Graceful Shutdown Handler
function gracefulShutdown(signal) {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    // Finish in-flight requests within 5 secs
    setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 5000);

    server.close(() => {
        logger.info('HTTP server closed');
        sequelize.close().then(() => {
            logger.info('Database connection closed');
            process.exit(0);
        });
    });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
