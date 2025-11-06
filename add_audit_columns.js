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

async function addMissingColumns() {
  try {
    console.log('🔧 Adding missing audit columns to users table...\n');
    
    // Check which audit columns are missing
    const existingColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name IN ('created_by', 'updated_by')
    `);
    
    const existingColumnNames = existingColumns.rows.map(row => row.column_name);
    console.log('📋 Existing audit columns:', existingColumnNames);
    
    // Add missing columns
    if (!existingColumnNames.includes('created_by')) {
      await pool.query(`ALTER TABLE users ADD COLUMN created_by INTEGER`);
      console.log('✅ Added created_by column');
    }
    
    if (!existingColumnNames.includes('updated_by')) {
      await pool.query(`ALTER TABLE users ADD COLUMN updated_by INTEGER`);
      console.log('✅ Added updated_by column');
    }
    
    // Test insert again
    console.log('\n🧪 Testing insert with audit columns...');
    try {
      const testResult = await pool.query(`
        INSERT INTO users (tenant_id, username, email, first_name, last_name, employee_number)
        VALUES (1, 'test@example.com', 'test@example.com', 'Test', 'User', 'TEST001')
        RETURNING id, email, created_by, created_at
      `);
      console.log('✅ Insert successful:', testResult.rows[0]);
      
      // Clean up test record
      await pool.query('DELETE FROM users WHERE email = $1', ['test@example.com']);
      console.log('🧹 Test record cleaned up');
      
    } catch (insertError) {
      console.log('❌ Insert still failed:', insertError.message);
    }
    
    // Show updated table structure
    const updatedColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 Updated users table structure:');
    updatedColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });
    
    await pool.end();
    console.log('\n✅ Database schema updated successfully!');
    
  } catch (error) {
    console.error('❌ Schema update failed:', error.message);
    await pool.end();
  }
}

addMissingColumns();