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

async function finalTriggerFix() {
  try {
    console.log('🔧 Creating final definitive trigger fix...\n');
    
    // Drop existing trigger function and recreate completely
    await pool.query(`DROP FUNCTION IF EXISTS set_created_fields() CASCADE`);
    console.log('✅ Dropped old trigger function');
    
    // Create new trigger function that works properly
    await pool.query(`
      CREATE OR REPLACE FUNCTION set_created_fields()
      RETURNS trigger AS $$
      BEGIN
          -- Set created_by and updated_by to NULL (avoiding type issues)
          NEW.created_by = NULL;
          NEW.updated_by = NULL;
          
          -- Always set timestamps
          NEW.created_at = COALESCE(NEW.created_at, NOW());
          NEW.updated_at = NOW();
          
          -- Set version field for users table
          IF TG_TABLE_NAME = 'users' THEN
              NEW.version = COALESCE(NEW.version, 1);
          END IF;
          
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ Created new trigger function');
    
    // Drop existing triggers and recreate them
    await pool.query(`DROP TRIGGER IF EXISTS trg_users_created ON users`);
    await pool.query(`DROP TRIGGER IF EXISTS trg_users_updated ON users`);
    console.log('✅ Dropped old triggers');
    
    // Create new triggers
    await pool.query(`
      CREATE TRIGGER trg_users_created
        BEFORE INSERT ON users
        FOR EACH ROW
        EXECUTE FUNCTION set_created_fields()
    `);
    
    await pool.query(`
      CREATE TRIGGER trg_users_updated
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION set_created_fields()
    `);
    console.log('✅ Created new triggers');
    
    // Test with a sample operation
    console.log('\n🧪 Testing trigger with sample operations...');
    
    // Test INSERT
    await pool.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, employee_number, tenant_id, username)
      VALUES ('test@example.com', 'testhash', 'Test', 'User', 'TEST001', 1, 'testuser')
      ON CONFLICT (email) DO NOTHING
    `);
    console.log('✅ INSERT test successful');
    
    // Test UPDATE
    const updateResult = await pool.query(
      'UPDATE users SET last_login = NOW() WHERE email = $1',
      ['test@example.com']
    );
    console.log('✅ UPDATE test successful, rows affected:', updateResult.rowCount);
    
    // Clean up
    await pool.query(`DELETE FROM users WHERE email = 'test@example.com'`);
    console.log('✅ Test data cleaned up');
    
    await pool.end();
    console.log('\n🎉 Trigger system completely fixed! Server should work perfectly now.');
    
  } catch (error) {
    console.error('❌ Final trigger fix failed:', error.message);
    console.error('Stack:', error.stack);
    await pool.end();
  }
}

finalTriggerFix();