// Auth info endpoint
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  res.status(200).json({
    message: 'Time Management API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      debug: 'GET /api/debug',
      login: 'POST /api/login',
      auth: 'GET /api/auth (this endpoint)'
    },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
};