const { Pool } = require('pg');

// Database Connection Pool - optimized for serverless
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD || ''), // Ensure password is a string
  ssl: { rejectUnauthorized: false }, // Always use SSL for external databases
  max: process.env.VERCEL ? 3 : 20, // Reduce pool size for serverless
  idleTimeoutMillis: process.env.VERCEL ? 10000 : 30000, // Shorter timeout for serverless
  connectionTimeoutMillis: process.env.VERCEL ? 8000 : 2000, // Longer timeout for cold starts
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
});

// Set session variables for Row Level Security
const setSessionVariables = async (client, userId, tenantId) => {
  try {
    await client.query(`SET session.current_user_id = '${userId}'`);
    await client.query(`SET session.current_tenant_id = '${tenantId}'`);
  } catch (error) {
    console.error('Error setting session variables:', error);
    throw error;
  }
};

// Execute query with RLS context
const executeWithRLS = async (query, params, userId, tenantId) => {
  const client = await pool.connect();
  try {
    await setSessionVariables(client, userId, tenantId);
    const result = await client.query(query, params);
    return result;
  } finally {
    client.release();
  }
};

// Execute transaction with RLS context
const executeTransactionWithRLS = async (queries, userId, tenantId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await setSessionVariables(client, userId, tenantId);
    
    const results = [];
    for (const { query, params } of queries) {
      const result = await client.query(query, params);
      results.push(result);
    }
    
    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection successful:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    // Don't crash in serverless environment, just log the error
    if (process.env.VERCEL) {
      console.warn('⚠️ Running in serverless mode, database will be tested on first request');
      return false;
    }
    return false;
  }
};

// Initialize database connection (skip in serverless cold starts)
if (!process.env.VERCEL) {
  testConnection();
}

module.exports = {
  pool,
  executeWithRLS,
  executeTransactionWithRLS,
  testConnection
};