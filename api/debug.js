// Debug endpoint
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  res.status(200).json({
    status: 'debug',
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      DB_HOST: process.env.DB_HOST ? 'SET' : 'MISSING',
      DB_PORT: process.env.DB_PORT ? 'SET' : 'MISSING',
      DB_NAME: process.env.DB_NAME ? 'SET' : 'MISSING',
      DB_USER: process.env.DB_USER ? 'SET' : 'MISSING',
      DB_PASSWORD: process.env.DB_PASSWORD ? 'SET' : 'MISSING',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING'
    },
    timestamp: new Date().toISOString()
  });
};