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

async function addAuthColumns() {
  try {
    console.log('🔧 Adding authentication columns to users table...\n');
    
    // Check if password_hash column already exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'password_hash'
    `);
    
    if (columnCheck.rows.length === 0) {
      // Add password_hash column
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN password_hash VARCHAR(255),
        ADD COLUMN first_name VARCHAR(100),
        ADD COLUMN last_name VARCHAR(100),
        ADD COLUMN employee_number VARCHAR(50),
        ADD COLUMN role VARCHAR(50) DEFAULT 'employee',
        ADD COLUMN is_active BOOLEAN DEFAULT true,
        ADD COLUMN last_login TIMESTAMP WITH TIME ZONE,
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `);
      
      console.log('✅ Added authentication columns to users table');
    } else {
      console.log('ℹ️  Authentication columns already exist');
    }
    
    // Show updated structure
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

addAuthColumns();