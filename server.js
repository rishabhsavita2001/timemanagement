const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Environment validation
const requiredEnvVars = [
  'JWT_SECRET',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  if (process.env.NODE_ENV === 'production') {
    // Don't exit in serverless, just log and continue
    console.warn('⚠️ Missing env vars, some features may not work');
  }
}

// Import routes with error handling
let authRoutes, apiRoutes;
try {
  authRoutes = require('./routes/auth');
  apiRoutes = require('./routes/api');
} catch (error) {
  console.error('Error loading routes:', error.message);
  // Create dummy routes if main routes fail
  authRoutes = require('express').Router();
  apiRoutes = require('express').Router();
  
  authRoutes.use('*', (req, res) => {
    res.status(503).json({ error: 'Auth service temporarily unavailable' });
  });
  
  apiRoutes.use('*', (req, res) => {
    res.status(503).json({ error: 'API service temporarily unavailable' });
  });
}

const { errorHandler } = require('./middleware/errorHandler');

// Import logger with fallback
let requestLogger;
try {
  requestLogger = require('./middleware/logger').requestLogger;
} catch (error) {
  console.error('Error loading logger:', error.message);
  requestLogger = (req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  };
}

const app = express();
const PORT = process.env.PORT || 3001;

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request Logging
app.use(requestLogger);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL
  });
});

// Debug endpoint for environment variables
app.get('/debug', (req, res) => {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    DB_HOST: process.env.DB_HOST ? 'SET' : 'MISSING',
    DB_PORT: process.env.DB_PORT ? 'SET' : 'MISSING',
    DB_NAME: process.env.DB_NAME ? 'SET' : 'MISSING',
    DB_USER: process.env.DB_USER ? 'SET' : 'MISSING',
    DB_PASSWORD: process.env.DB_PASSWORD ? 'SET' : 'MISSING',
    JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING'
  };
  
  res.status(200).json({
    status: 'debug',
    environment: envVars,
    timestamp: new Date().toISOString()
  });
});

// Routes - with error handling
try {
  app.use('/auth', authRoutes);
  app.use('/api', apiRoutes);
} catch (error) {
  console.error('Error loading routes:', error);
  if (process.env.NODE_ENV === 'production') {
    // In production, send a more generic error
    app.use('*', (req, res) => {
      res.status(500).json({
        error: 'Service temporarily unavailable',
        message: 'Please try again later'
      });
    });
  }
}

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use(errorHandler);

// Start Server
// app.listen(PORT, () => {
//   console.log(`🚀 Working Time API Server running on port ${PORT}`);
//   console.log(`📊 Environment: ${process.env.NODE_ENV}`);
//   console.log(`🗄️  Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
// });


module.exports = app;
