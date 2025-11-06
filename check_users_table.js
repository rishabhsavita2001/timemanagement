require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function checkUserTable() {
  try {
    console.log('🔍 Checking users table structure...\n');
    
    // Check users table columns
    const usersColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Users table columns:');
    usersColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    await pool.end();
    console.log('\n✅ User table check complete!');
    
  } catch (error) {
    console.error('❌ User table check failed:', error.message);
    await pool.end();
  }
}

checkUserTable();