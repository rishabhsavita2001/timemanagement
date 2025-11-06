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

async function checkUserTableConstraints() {
  try {
    console.log('🔍 Checking users table constraints and triggers...\n');
    
    // Check triggers on users table
    const triggersResult = await pool.query(`
      SELECT trigger_name, event_manipulation, action_statement, action_timing
      FROM information_schema.triggers 
      WHERE event_object_table = 'users'
      ORDER BY trigger_name
    `);
    
    console.log('🎯 Triggers on users table:');
    if (triggersResult.rows.length > 0) {
      triggersResult.rows.forEach(trigger => {
        console.log(`  - ${trigger.trigger_name}: ${trigger.action_timing} ${trigger.event_manipulation}`);
        console.log(`    Action: ${trigger.action_statement}`);
      });
    } else {
      console.log('  No triggers found');
    }
    
    // Check constraints
    const constraintsResult = await pool.query(`
      SELECT constraint_name, constraint_type, table_name
      FROM information_schema.table_constraints 
      WHERE table_name = 'users'
      ORDER BY constraint_name
    `);
    
    console.log('\n🔒 Constraints on users table:');
    constraintsResult.rows.forEach(constraint => {
      console.log(`  - ${constraint.constraint_name}: ${constraint.constraint_type}`);
    });
    
    // Try a simple insert to see what happens
    console.log('\n🧪 Testing simple insert...');
    try {
      const testResult = await pool.query(`
        INSERT INTO users (tenant_id, username, email, first_name, last_name, employee_number)
        VALUES (1, 'test@example.com', 'test@example.com', 'Test', 'User', 'TEST001')
        RETURNING id, email
      `);
      console.log('✅ Simple insert successful:', testResult.rows[0]);
      
      // Clean up test record
      await pool.query('DELETE FROM users WHERE email = $1', ['test@example.com']);
      console.log('🧹 Test record cleaned up');
      
    } catch (insertError) {
      console.log('❌ Simple insert failed:', insertError.message);
      console.log('Full error:', insertError);
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
    await pool.end();
  }
}

checkUserTableConstraints();