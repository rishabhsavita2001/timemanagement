const winston = require('winston');
const path = require('path');

// Create winston logger - optimized for serverless
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'working-time-api' },
  transports: [
    // Use console logging for Vercel serverless compatibility
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Only add file logging in local development
if (process.env.NODE_ENV === 'development' && !process.env.VERCEL) {
  logger.add(new winston.transports.File({ 
    filename: path.join(__dirname, '../logs/error.log'), 
    level: 'error' 
  }));
  logger.add(new winston.transports.File({ 
    filename: path.join(__dirname, '../logs/combined.log') 
  }));
}

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  logger.info('Request started', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    tenantId: req.user?.tenantId
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
      tenantId: req.user?.tenantId
    });

    originalEnd.apply(this, args);
  };

  next();
};

// Audit logging for sensitive operations
const auditLog = (action, details) => {
  logger.info('Audit Log', {
    action,
    details,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  logger,
  requestLogger,
  auditLog
};