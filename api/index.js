// Simplified serverless function entry point
const express = require('express');

const app = express();

// Basic middleware
app.use(express.json());

// Test if basic Express works
app.get('/', (req, res) => {
  res.json({
    message: 'Main API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL
  });
});

// Debug endpoint
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

// Test loading the original server
app.get('/test-server-load', (req, res) => {
  try {
    // Try to load the original server
    require('../server');
    res.json({
      status: 'Original server loaded successfully',
      message: 'No errors in server.js'
    });
  } catch (error) {
    res.status(500).json({
      status: 'Original server failed to load',
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = app;