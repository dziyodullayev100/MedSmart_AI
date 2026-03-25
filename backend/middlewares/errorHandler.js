const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message || 'Internal Server Error';
    let code = 'INTERNAL_ERROR';
    let details = null;

    // Catch Sequelize validation errors
    if (err.name === 'SequelizeValidationError') {
        statusCode = 400;
        message = 'Validation error';
        code = 'VALIDATION_ERROR';
        details = err.errors.map(e => ({ field: e.path, message: e.message }));
    }

    // Catch Sequelize unique constraint errors
    if (err.name === 'SequelizeUniqueConstraintError') {
        statusCode = 409;
        code = 'CONFLICT_ERROR';
        details = err.errors.map(e => ({ field: e.path, message: e.message }));
        if (details.length > 0 && details[0].message) {
            message = details[0].message; // e.g. "email must be unique" -> "Email already exists"
            if (message === 'email must be unique') {
                message = 'Email already exists';
            }
        } else {
            message = 'Resource already exists';
        }
    }

    // Catch JWT errors
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Not authorized, token failed';
        code = 'UNAUTHORIZED_ERROR';
    }

    // Catch axios errors (AI service down)
    if (err.isAxiosError) {
        statusCode = 503;
        message = 'AI service is currently down or unresponsive';
        code = 'SERVICE_UNAVAILABLE';
    }

    // Log the error
    logger.error(message, {
        method: req.method,
        path: req.originalUrl || req.path,
        statusCode,
        error: process.env.NODE_ENV === 'production' ? err.name : err.stack
    });

    res.status(statusCode).json({
        success: false,
        message,
        code,
        ...(details && { details }),
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
};

module.exports = errorHandler;
