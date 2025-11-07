// Simple test login endpoint without database
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      method: req.method,
      url: req.url 
    });
  }

  try {
    // Parse JSON body
    let body = '';
    
    for await (const chunk of req) {
      body += chunk;
    }
    
    const { email, password } = JSON.parse(body);

    res.status(200).json({
      success: true,
      message: 'Test login endpoint working!',
      received: {
        email: email || 'not provided',
        password: password ? 'provided' : 'not provided'
      },
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url
    });

  } catch (error) {
    res.status(400).json({
      error: 'Bad request',
      message: error.message,
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url
    });
  }
};