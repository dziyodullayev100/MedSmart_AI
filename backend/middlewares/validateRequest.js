const Joi = require('joi');

const validateRequest = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
        const details = error.details.map(err => ({
            field: err.context.key,
            message: err.message
        }));
        
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            code: 'VALIDATION_ERROR',
            details
        });
    }
    
    next();
};

const schemas = {
    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required()
    }),
    
    register: Joi.object({
        name: Joi.string().min(2).max(50).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).max(100).required(),
        phone: Joi.string().optional()
    }),
    
    seasonalPrediction: Joi.object({
        patientId: Joi.number().integer().required()
    }),
    
    diseaseProgression: Joi.object({
        patientId: Joi.number().integer().required()
    }),
    
    aiChat: Joi.object({
        message: Joi.string().min(1).max(500).required(),
        patientId: Joi.number().integer().optional(),
        session_id: Joi.string().optional()
    })
};

module.exports = {
    validateRequest,
    schemas
};
