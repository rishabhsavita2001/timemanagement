// Minimal serverless function for debugging
const express = require('express');

const app = express();

// Basic middleware
app.use(express.json());

// Simple test endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Environment test
app.get('/env-test', (req, res) => {
  res.json({
    hasDbHost: !!process.env.DB_HOST,
    hasJwtSecret: !!process.env.JWT_SECRET,
    nodeEnv: process.env.NODE_ENV,
    vercel: process.env.VERCEL
  });
});

// Error test
app.get('/error-test', (req, res) => {
  try {
    throw new Error('Test error');
  } catch (err) {
    res.status(500).json({
      error: 'Test error caught successfully',
      message: err.message
    });
  }
});

module.exports = app;