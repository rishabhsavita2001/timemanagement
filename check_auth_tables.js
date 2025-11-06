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

async function checkAuthTables() {
  try {
    console.log('🔍 Checking authentication-related tables...\n');
    
    // Check swiss_employees table structure
    const swissEmployeesColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'swiss_employees' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('📊 swiss_employees table structure:');
    swissEmployeesColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // Check users table structure
    const usersColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 users table structure:');
    usersColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // Check if there are any sample records
    const swissEmployeeCount = await pool.query('SELECT COUNT(*) as count FROM swiss_employees');
    const usersCount = await pool.query('SELECT COUNT(*) as count FROM users');
    const tenantsData = await pool.query('SELECT id, name FROM tenants LIMIT 5');
    
    console.log(`\n📈 swiss_employees records: ${swissEmployeeCount.rows[0].count}`);
    console.log(`📈 users records: ${usersCount.rows[0].count}`);
    console.log(`📈 Available tenants:`);
    tenantsData.rows.forEach(tenant => {
      console.log(`  - ID: ${tenant.id}, Name: ${tenant.name}`);
    });
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
    await pool.end();
  }
}

checkAuthTables();