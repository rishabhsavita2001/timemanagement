// Ultra minimal serverless function for debugging
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.url === '/') {
    res.status(200).json({
      message: 'Ultra minimal API working!',
      timestamp: new Date().toISOString(),
      url: req.url,
      method: req.method
    });
    return;
  }
  
  if (req.url === '/health') {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  if (req.url === '/debug') {
    res.status(200).json({
      status: 'debug',
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        DB_PASSWORD: process.env.DB_PASSWORD ? 'SET' : 'MISSING'
      },
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  if (req.url === '/express-test') {
    try {
      const express = require('express');
      const app = express();
      
      res.status(200).json({
        status: 'Express loaded successfully',
        message: 'Express is available'
      });
    } catch (error) {
      res.status(500).json({
        status: 'Express failed to load',
        error: error.message
      });
    }
    return;
  }
  
  res.status(404).json({
    error: 'Not found',
    url: req.url,
    availableEndpoints: ['/', '/health', '/debug', '/express-test']
  });
};