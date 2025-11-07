// Fixed serverless function with proper URL parsing
const url = require('url');

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  // Parse the URL to get the pathname
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  console.log('Request URL:', req.url, 'Pathname:', pathname);
  
  if (pathname === '/' || pathname === '') {
    res.status(200).json({
      message: 'Ultra minimal API working!',
      timestamp: new Date().toISOString(),
      url: req.url,
      pathname: pathname,
      method: req.method
    });
    return;
  }
  
  if (pathname === '/health') {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      pathname: pathname
    });
    return;
  }
  
  if (pathname === '/debug') {
    res.status(200).json({
      status: 'debug',
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        DB_HOST: process.env.DB_HOST ? 'SET' : 'MISSING',
        DB_PASSWORD: process.env.DB_PASSWORD ? 'SET' : 'MISSING',
        JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING'
      },
      pathname: pathname,
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  if (pathname === '/express-test') {
    try {
      const express = require('express');
      res.status(200).json({
        status: 'Express loaded successfully',
        message: 'Express is available',
        pathname: pathname
      });
    } catch (error) {
      res.status(500).json({
        status: 'Express failed to load',
        error: error.message,
        pathname: pathname
      });
    }
    return;
  }
  
  res.status(404).json({
    error: 'Not found',
    url: req.url,
    pathname: pathname,
    availableEndpoints: ['/', '/health', '/debug', '/express-test']
  });
};