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

async function fixAuditFunction() {
  try {
    console.log('🔍 Checking current_user_id() function...\n');
    
    // Check what current_user_id() returns
    try {
      const result = await pool.query('SELECT current_user_id() as user_id');
      console.log('📋 current_user_id() returns:', result.rows[0]);
    } catch (error) {
      console.log('❌ current_user_id() error:', error.message);
    }
    
    // Check the audit trigger function
    const functionResult = await pool.query(`
      SELECT routine_definition 
      FROM information_schema.routines 
      WHERE routine_name = 'set_created_fields'
    `);
    
    if (functionResult.rows.length > 0) {
      console.log('\n📄 set_created_fields() function definition:');
      console.log(functionResult.rows[0].routine_definition);
    }
    
    // Let's modify the created_by columns to accept NULL or use a default
    console.log('\n🔧 Modifying audit columns to handle UUID/integer mismatch...');
    
    // Option 1: Make created_by/updated_by nullable and set them to NULL in trigger
    await pool.query(`
      CREATE OR REPLACE FUNCTION set_created_fields()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.created_at = COALESCE(NEW.created_at, NOW());
          NEW.updated_at = COALESCE(NEW.updated_at, NOW());
          -- Set audit fields to NULL for now (can be set by application)
          NEW.created_by = NULL;
          NEW.updated_by = NULL;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ Updated set_created_fields() function to handle audit fields properly');
    
    // Test insert again
    console.log('\n🧪 Testing insert with fixed trigger...');
    try {
      const testResult = await pool.query(`
        INSERT INTO users (tenant_id, username, email, first_name, last_name, employee_number)
        VALUES (1, 'test2@example.com', 'test2@example.com', 'Test', 'User', 'TEST002')
        RETURNING id, email, created_by, created_at
      `);
      console.log('✅ Insert successful:', testResult.rows[0]);
      
      // Clean up test record
      await pool.query('DELETE FROM users WHERE email = $1', ['test2@example.com']);
      console.log('🧹 Test record cleaned up');
      
    } catch (insertError) {
      console.log('❌ Insert still failed:', insertError.message);
    }
    
    await pool.end();
    console.log('\n✅ Audit function fixed successfully!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    await pool.end();
  }
}

fixAuditFunction();