// Progressive serverless function testing
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
    hasDbPort: !!process.env.DB_PORT,
    hasDbName: !!process.env.DB_NAME,
    hasDbUser: !!process.env.DB_USER,
    hasDbPassword: !!process.env.DB_PASSWORD,
    hasJwtSecret: !!process.env.JWT_SECRET,
    nodeEnv: process.env.NODE_ENV,
    vercel: process.env.VERCEL
  });
});

// Test database connection
app.get('/db-test', async (req, res) => {
  try {
    const { Pool } = require('pg');
    
    const pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
      max: 1, // Single connection for test
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000
    });

    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    await pool.end();

    res.json({
      status: 'database connection successful',
      timestamp: result.rows[0].now,
      message: 'Database is reachable'
    });
  } catch (error) {
    res.status(500).json({
      status: 'database connection failed',
      error: error.message,
      code: error.code
    });
  }
});

// Test middleware loading
app.get('/middleware-test', (req, res) => {
  try {
    // Test loading various middleware
    const path = require('path');
    const winston = require('winston');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    
    res.json({
      status: 'middleware loading successful',
      modules: {
        path: 'loaded',
        winston: 'loaded',
        bcrypt: 'loaded',
        jwt: 'loaded'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'middleware loading failed',
      error: error.message
    });
  }
});

module.exports = app;