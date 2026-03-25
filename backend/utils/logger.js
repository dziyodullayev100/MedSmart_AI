/**
 * logger.js
 * Centralized Winston logger for MedSmart backend.
 *
 * - Development:  logs to console with colorized output
 * - All environments: logs to logs/app.log file
 * - Sensitive data (passwords, tokens) must NEVER be logged
 */

const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const { combine, timestamp, printf, colorize, errors } = format;

// Custom log format: timestamp + level + message + optional metadata
const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
});

const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        logFormat
    ),
    transports: [
        // Write all logs to file
        new transports.File({
            filename: path.join(logsDir, 'app.log'),
            maxsize: 5 * 1024 * 1024,   // 5 MB
            maxFiles: 5,
            tailable: true
        })
    ]
});

// In development also log to console with colors
if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
        format: combine(
            colorize({ all: true }),
            timestamp({ format: 'HH:mm:ss' }),
            errors({ stack: true }),
            logFormat
        )
    }));
}

module.exports = logger;
