const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateToken, hashPassword, comparePassword } = require('../middleware/auth');
const { validateBody, schemas } = require('../middleware/validation');
const { pool } = require('../config/database');
const { auditLog } = require('../middleware/logger');

const router = express.Router();

// Login endpoint
router.post('/login', validateBody(schemas.login), asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user with credentials
  const userQuery = `
    SELECT 
      u.id,
      u.tenant_id,
      u.employee_number,
      u.first_name,
      u.last_name,
      u.email,
      u.password_hash,
      u.is_active,
      u.last_login,
      t.name as tenant_name
    FROM users u
    JOIN tenants t ON u.tenant_id = t.id
    WHERE LOWER(u.email) = LOWER($1) AND u.is_active = true
  `;

  const userResult = await pool.query(userQuery, [email]);

  if (userResult.rows.length === 0) {
    auditLog('LOGIN_FAILED', { email, reason: 'User not found' });
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid email or password'
    });
  }

  const user = userResult.rows[0];

  // Verify password
  const isValidPassword = await comparePassword(password, user.password_hash);
  if (!isValidPassword) {
    auditLog('LOGIN_FAILED', { email, userId: user.id, reason: 'Invalid password' });
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid email or password'
    });
  }

  // Update last login
  await pool.query(
    'UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = $1',
    [user.id]
  );

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    tenantId: user.tenant_id,
    email: user.email
  });

  auditLog('LOGIN_SUCCESS', { 
    userId: user.id, 
    tenantId: user.tenant_id,
    email: user.email 
  });

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user.id,
        tenantId: user.tenant_id,
        employeeNumber: user.employee_number,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        tenantName: user.tenant_name
      }
    }
  });
}));

// Register endpoint (for demo purposes - in production, this would be admin only)
router.post('/register', validateBody(schemas.register), asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, employeeNumber, tenantId } = req.body;

  // Check if user already exists
  const existingUser = await pool.query(
    'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
    [email]
  );

  if (existingUser.rows.length > 0) {
    return res.status(409).json({
      error: 'User already exists',
      message: 'An account with this email already exists'
    });
  }

  // Check if tenant exists and is active
  const tenantResult = await pool.query(
    'SELECT id FROM tenants WHERE id = $1',
    [tenantId]
  );

  if (tenantResult.rows.length === 0) {
    return res.status(400).json({
      error: 'Invalid tenant',
      message: 'The specified tenant does not exist or is inactive'
    });
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const insertQuery = `
    INSERT INTO users (
      tenant_id, employee_number, first_name, last_name, email, password_hash, 
      username, is_active, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $5, true, NOW(), NOW())
    RETURNING id, employee_number, first_name, last_name, email, tenant_id
  `;

  const newUser = await pool.query(insertQuery, [
    tenantId,
    employeeNumber || `EMP${Date.now()}`,
    firstName,
    lastName,
    email,
    passwordHash
  ]);

  auditLog('USER_REGISTERED', {
    userId: newUser.rows[0].id,
    tenantId,
    email
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: newUser.rows[0]
    }
  });
}));

// Refresh token endpoint
router.post('/refresh', asyncHandler(async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Token required',
      message: 'Please provide a valid token'
    });
  }

  try {
    const { verifyToken } = require('../middleware/auth');
    const decoded = verifyToken(token);

    // Verify user still exists and is active
    const userResult = await pool.query(`
      SELECT 
        u.id,
        u.tenant_id,
        u.email,
        u.is_active
      FROM users u
      JOIN tenants t ON u.tenant_id = t.id
      WHERE u.id = $1 AND u.is_active = true
    `, [decoded.userId]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid user',
        message: 'User not found or inactive'
      });
    }

    const user = userResult.rows[0];

    // Generate new token
    const newToken = generateToken({
      userId: user.id,
      tenantId: user.tenant_id,
      email: user.email
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken
      }
    });

  } catch (error) {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Unable to refresh token'
    });
  }
}));

// Logout endpoint (for audit logging)
router.post('/logout', asyncHandler(async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const { verifyToken } = require('../middleware/auth');
      const decoded = verifyToken(token);
      
      auditLog('LOGOUT', {
        userId: decoded.userId,
        tenantId: decoded.tenantId
      });
    } catch (error) {
      // Token invalid, but still return success for logout
    }
  }

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

module.exports = router;