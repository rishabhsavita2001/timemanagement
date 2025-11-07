// Login endpoint
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse JSON body
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const { email, password } = JSON.parse(body);

        if (!email || !password) {
          return res.status(400).json({
            error: 'Validation Error',
            message: 'Email and password are required'
          });
        }

        // Database connection
        const pool = new Pool({
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT) || 5432,
          database: process.env.DB_NAME,
          user: process.env.DB_USER,
          password: String(process.env.DB_PASSWORD || ''),
          ssl: { rejectUnauthorized: false },
          max: 3,
          idleTimeoutMillis: 10000,
          connectionTimeoutMillis: 8000
        });

        // Find user
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
          await pool.end();
          return res.status(401).json({
            error: 'Authentication failed',
            message: 'Invalid email or password'
          });
        }

        const user = userResult.rows[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
          await pool.end();
          return res.status(401).json({
            error: 'Authentication failed',
            message: 'Invalid email or password'
          });
        }

        // Generate JWT token
        const tokenPayload = {
          id: user.id,
          tenantId: user.tenant_id,
          email: user.email,
          employeeNumber: user.employee_number
        };

        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRES_IN || '8h'
        });

        // Update last login
        await pool.query(
          'UPDATE users SET last_login = NOW() WHERE id = $1',
          [user.id]
        );

        await pool.end();

        res.status(200).json({
          message: 'Login successful',
          user: {
            id: user.id,
            employeeNumber: user.employee_number,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            tenant: {
              id: user.tenant_id,
              name: user.tenant_name
            }
          },
          token: token
        });

      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        res.status(400).json({
          error: 'Invalid JSON',
          message: parseError.message
        });
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Please try again later'
    });
  }
};