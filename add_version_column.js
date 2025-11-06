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

async function addVersionColumn() {
  try {
    console.log('🔧 Adding version column to users table...\n');
    
    // Check if version column already exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'version'
    `);
    
    if (columnCheck.rows.length === 0) {
      // Add version column
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN version INTEGER DEFAULT 1
      `);
      
      console.log('✅ Added version column to users table');
      
      // Update existing records to have version = 1
      const updateResult = await pool.query(`
        UPDATE users 
        SET version = 1 
        WHERE version IS NULL
      `);
      
      console.log(`✅ Updated ${updateResult.rowCount} existing users with version = 1`);
      
    } else {
      console.log('ℹ️  Version column already exists');
    }
    
    // Show updated structure
    const updatedColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 Updated users table structure:');
    updatedColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    await pool.end();
    console.log('\n✅ Database schema updated successfully!');
    
  } catch (error) {
    console.error('❌ Schema update failed:', error.message);
    await pool.end();
  }
}

addVersionColumn();