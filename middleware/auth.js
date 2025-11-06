const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

// Generate JWT Token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    issuer: process.env.JWT_ISSUER || 'working-time-api',
    audience: process.env.JWT_AUDIENCE || 'working-time-client'
  });
};

// Verify JWT Token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: process.env.JWT_ISSUER || 'working-time-api',
      audience: process.env.JWT_AUDIENCE || 'working-time-client'
    });
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// JWT Authentication Middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Please provide a valid authentication token'
      });
    }

    const decoded = verifyToken(token);
    
    // Verify user still exists and is active
    const userQuery = `
      SELECT 
        u.id,
        u.tenant_id,
        u.employee_number,
        u.first_name,
        u.last_name,
        u.email,
        u.is_active,
        t.name as tenant_name
      FROM users u
      JOIN tenants t ON u.tenant_id = t.id
      WHERE u.id = $1 AND u.is_active = true
    `;

    const userResult = await pool.query(userQuery, [decoded.userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid user',
        message: 'User not found or inactive'
      });
    }

    // Attach user info to request
    req.user = {
      id: userResult.rows[0].id,
      tenantId: userResult.rows[0].tenant_id,
      employeeNumber: userResult.rows[0].employee_number,
      firstName: userResult.rows[0].first_name,
      lastName: userResult.rows[0].last_name,
      email: userResult.rows[0].email,
      tenantName: userResult.rows[0].tenant_name
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({
      error: 'Invalid token',
      message: 'Please provide a valid authentication token'
    });
  }
};

// Hash password
const hashPassword = async (password) => {
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
  return await bcrypt.hash(password, saltRounds);
};

// Compare password
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

module.exports = {
  generateToken,
  verifyToken,
  authenticateToken,
  hashPassword,
  comparePassword
};