// Health endpoint
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL
  });
};