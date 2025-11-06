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

async function fixTriggerFunction() {
  try {
    console.log('🔧 Fixing the set_created_fields trigger function...\n');
    
    // Update the trigger function to handle UUID vs INTEGER mismatch
    await pool.query(`
      CREATE OR REPLACE FUNCTION set_created_fields()
      RETURNS trigger AS $$
      DECLARE
          user_id_val text;
      BEGIN
          -- Get the current user ID
          user_id_val := current_user_id();
          
          -- Only set created_by/updated_by if it's a valid integer
          -- Skip UUID values that can't be converted to integer
          IF user_id_val ~ '^[0-9]+$' THEN
              NEW.created_by = user_id_val::integer;
              NEW.updated_by = user_id_val::integer;
          ELSE
              NEW.created_by = NULL;
              NEW.updated_by = NULL;
          END IF;
          
          -- Always set timestamps
          NEW.created_at = COALESCE(NEW.created_at, NOW());
          NEW.updated_at = NOW();
          
          -- Set version if column exists
          IF TG_TABLE_NAME = 'users' THEN
              NEW.version = COALESCE(NEW.version, 1);
          END IF;
          
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ Updated set_created_fields() function to handle UUID vs INTEGER');
    
    // Test the function by checking what current_user_id() returns
    const userIdTest = await pool.query(`SELECT current_user_id() as user_id`);
    console.log(`📋 current_user_id() returns: "${userIdTest.rows[0].user_id}"`);
    
    // Check if it's a valid integer
    const userIdValue = userIdTest.rows[0].user_id;
    const isInteger = /^[0-9]+$/.test(userIdValue);
    console.log(`📋 Is valid integer: ${isInteger}`);
    
    await pool.end();
    console.log('\n✅ Trigger function updated successfully!');
    
  } catch (error) {
    console.error('❌ Trigger fix failed:', error.message);
    await pool.end();
  }
}

fixTriggerFunction();