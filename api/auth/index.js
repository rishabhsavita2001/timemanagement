// Auth endpoints index
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  res.status(200).json({
    message: 'Auth API',
    endpoints: {
      login: 'POST /api/auth/login',
      logout: 'POST /api/auth/logout (coming soon)',
      register: 'POST /api/auth/register (coming soon)'
    },
    timestamp: new Date().toISOString()
  });
};