const { Pool } = require('pg');

// Database Connection Pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection could not be established
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
    return false;
  }
};

// Initialize database connection
testConnection();

module.exports = {
  pool,
  executeWithRLS,
  executeTransactionWithRLS,
  testConnection
};