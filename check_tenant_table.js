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

async function checkTenantTable() {
  try {
    console.log('🔍 Checking tenants table structure...\n');
    
    // Check tenants table columns
    const tenantsColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'tenants'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Tenants table columns:');
    tenantsColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check if there are any tenants
    const tenantData = await pool.query('SELECT * FROM tenants LIMIT 5');
    console.log('\n📋 Sample tenant data:');
    tenantData.rows.forEach(tenant => {
      console.log(`  - ID: ${tenant.tenant_id}, Name: ${tenant.tenant_name || 'N/A'}`);
    });
    
    // Test the corrected authentication query
    console.log('\n🧪 Testing corrected authentication query...');
    const testQuery = `
      SELECT 
        u.id,
        u.tenant_id,
        u.employee_number,
        u.first_name,
        u.last_name,
        u.email,
        u.is_active,
        u.hire_date,
        t.tenant_name
      FROM users u
      JOIN tenants t ON u.tenant_id = t.tenant_id
      WHERE u.id = $1 AND u.is_active = true
    `;
    
    const testResult = await pool.query(testQuery, [7]); // Using userId 7 from the login
    console.log('✅ Query successful! User data:');
    console.log(JSON.stringify(testResult.rows[0], null, 2));
    
    await pool.end();
    console.log('\n✅ Tenant table check complete!');
    
  } catch (error) {
    console.error('❌ Tenant check failed:', error.message);
    await pool.end();
  }
}

checkTenantTable();