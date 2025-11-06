require('dotenv').config();
const { Pool } = require('pg');

console.log('='.repeat(50));
console.log('ENVIRONMENT VARIABLES TEST');
console.log('='.repeat(50));
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***LOADED***' : 'NOT LOADED');
console.log('DB_SSL:', process.env.DB_SSL);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
});

async function testWithEnvVars() {
  try {
    console.log('\n🧪 Testing connection with env vars...');
    const client = await pool.connect();
    console.log('✅ Connection SUCCESSFUL with env vars!');
    
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Query SUCCESSFUL:', result.rows[0].current_time);
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Connection FAILED with env vars:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    await pool.end();
  }
}

testWithEnvVars();