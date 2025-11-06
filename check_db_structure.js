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

async function checkDatabaseStructure() {
  try {
    console.log('🔍 Checking database structure...\n');
    
    // Check what tables exist
    const tablesResult = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    console.log('📋 Available tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.tablename}`);
    });
    
    // Check if employees table exists and its structure
    console.log('\n🔍 Checking employee-related tables...');
    
    const employeeTables = tablesResult.rows.filter(row => 
      row.tablename.includes('employee') || row.tablename.includes('user')
    );
    
    for (const table of employeeTables) {
      try {
        const columnsResult = await pool.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position
        `, [table.tablename]);
        
        console.log(`\n📊 ${table.tablename} structure:`);
        columnsResult.rows.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
        });
      } catch (error) {
        console.log(`  ❌ Could not describe ${table.tablename}: ${error.message}`);
      }
    }
    
    // Check if tenants table exists
    console.log('\n🔍 Checking tenants table...');
    const tenantsResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'tenants' AND table_schema = 'public'
    `);
    
    if (tenantsResult.rows[0].count > 0) {
      console.log('✅ tenants table exists');
      
      const tenantsColumns = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'tenants' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      
      console.log('📊 tenants table structure:');
      tenantsColumns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
      
      // Check if there are any tenants
      const tenantCount = await pool.query('SELECT COUNT(*) as count FROM tenants');
      console.log(`📈 Number of tenants: ${tenantCount.rows[0].count}`);
      
    } else {
      console.log('❌ tenants table does not exist');
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    await pool.end();
  }
}

checkDatabaseStructure();