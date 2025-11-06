const Joi = require('joi');

// Custom date transform that accepts multiple formats and normalizes to ISO
const flexibleDate = () => {
  return Joi.alternatives().try(
    // ISO date already valid
    Joi.date().iso(),
    // YYYY-MM-DD string format
    Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).custom((value, helpers) => {
      const date = new Date(value + 'T00:00:00.000Z');
      if (isNaN(date.getTime())) {
        return helpers.error('any.invalid');
      }
      return date.toISOString().split('T')[0];
    }),
    // MM/DD/YYYY format (common US format)
    Joi.string().pattern(/^\d{1,2}\/\d{1,2}\/\d{4}$/).custom((value, helpers) => {
      const [month, day, year] = value.split('/');
      const date = new Date(year, month - 1, day);
      if (isNaN(date.getTime()) || date.getFullYear() != year || date.getMonth() != month - 1 || date.getDate() != day) {
        return helpers.error('any.invalid');
      }
      return date.toISOString().split('T')[0];
    }),
    // DD/MM/YYYY format (common European format)
    Joi.string().pattern(/^\d{1,2}\/\d{1,2}\/\d{4}$/).custom((value, helpers) => {
      const [day, month, year] = value.split('/');
      const date = new Date(year, month - 1, day);
      if (isNaN(date.getTime()) || date.getFullYear() != year || date.getMonth() != month - 1 || date.getDate() != day) {
        return helpers.error('any.invalid');
      }
      return date.toISOString().split('T')[0];
    }),
    // DD-MM-YYYY format
    Joi.string().pattern(/^\d{1,2}-\d{1,2}-\d{4}$/).custom((value, helpers) => {
      const [day, month, year] = value.split('-');
      const date = new Date(year, month - 1, day);
      if (isNaN(date.getTime()) || date.getFullYear() != year || date.getMonth() != month - 1 || date.getDate() != day) {
        return helpers.error('any.invalid');
      }
      return date.toISOString().split('T')[0];
    })
  ).error(new Error('Date must be in format YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY, or DD-MM-YYYY'));
};

// Validation middleware factory
const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details ? error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      })) : [{ field: 'unknown', message: error.message || 'Validation failed' }];

      return res.status(400).json({
        error: 'Validation Error',
        message: 'Request validation failed',
        details
      });
    }

    req.body = value;
    next();
  };
};

const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false
    });

    if (error) {
      const details = error.details ? error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      })) : [{ field: 'unknown', message: error.message || 'Parameter validation failed' }];

      return res.status(400).json({
        error: 'Validation Error',
        message: 'Parameter validation failed',
        details
      });
    }

    req.params = value;
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details ? error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      })) : [{ field: 'unknown', message: error.message || 'Query parameter validation failed' }];

      return res.status(400).json({
        error: 'Validation Error',
        message: 'Query parameter validation failed',
        details
      });
    }

    req.query = value;
    next();
  };
};

// Common validation schemas
const schemas = {
  // Authentication schemas
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  }),

  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
      .messages({
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
      }),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    employeeNumber: Joi.string().max(20),
    tenantId: Joi.number().integer().positive().required()
  }),

  // Time entry schemas
  timeEntry: Joi.object({
    date: flexibleDate().required(),
    clockIn: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    clockOut: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).allow(null),
    breakDuration: Joi.number().min(0).max(720).default(0), // Max 12 hours in minutes
    notes: Joi.string().max(500).allow(''),
    projectId: Joi.number().integer().positive().allow(null),
    taskId: Joi.number().integer().positive().allow(null)
  }),

  // Leave request schemas
  leaveRequest: Joi.object({
    leaveTypeId: Joi.number().integer().positive().required(),
    startDate: flexibleDate().required(),
    endDate: flexibleDate().required(),
    reason: Joi.string().max(1000).required(),
    isHalfDay: Joi.boolean().default(false),
    halfDayPeriod: Joi.string().valid('morning', 'afternoon').when('isHalfDay', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.allow(null)
    })
  }),

  // Common parameter schemas
  id: Joi.object({
    id: Joi.number().integer().positive().required()
  }),

  dateRange: Joi.object({
    startDate: flexibleDate().required(),
    endDate: flexibleDate().required()
  }),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().max(50),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
};

module.exports = {
  validateBody,
  validateParams,
  validateQuery,
  schemas
};