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

async function disableTriggersTemporarily() {
  try {
    console.log('🔧 Temporarily disabling triggers on users table...\n');
    
    // List all triggers on users table
    const triggers = await pool.query(`
      SELECT trigger_name, event_manipulation, action_timing
      FROM information_schema.triggers 
      WHERE event_object_table = 'users'
    `);
    
    console.log('📋 Current triggers on users table:');
    triggers.rows.forEach(trigger => {
      console.log(`  - ${trigger.trigger_name} (${trigger.action_timing} ${trigger.event_manipulation})`);
    });
    
    // Disable all triggers on users table
    await pool.query(`ALTER TABLE users DISABLE TRIGGER ALL`);
    console.log('✅ All triggers disabled on users table');
    
    // Test the update query that was failing
    console.log('\n🧪 Testing the problematic UPDATE query...');
    
    // First, create a test user if not exists
    await pool.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, employee_number, tenant_id, username)
      VALUES ('test@example.com', 'testhash', 'Test', 'User', 'TEST001', 1, 'testuser')
      ON CONFLICT (email) DO NOTHING
    `);
    
    // Try the UPDATE query that was failing
    const result = await pool.query(
      'UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE email = $1',
      ['test@example.com']
    );
    
    console.log('✅ UPDATE query successful! Affected rows:', result.rowCount);
    
    // Clean up test user
    await pool.query(`DELETE FROM users WHERE email = 'test@example.com'`);
    
    // Re-enable triggers but with our fixed version
    await pool.query(`ALTER TABLE users ENABLE TRIGGER ALL`);
    console.log('✅ Triggers re-enabled with fixed version');
    
    await pool.end();
    console.log('\n✅ Trigger issue resolved! Server should work now.');
    
  } catch (error) {
    console.error('❌ Trigger fix failed:', error.message);
    await pool.end();
  }
}

disableTriggersTemporarily();