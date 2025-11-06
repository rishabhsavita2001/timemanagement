const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function checkLeaveRequestsStructure() {
  try {
    // Check the structure of leave_requests table
    const structure = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'leave_requests'
      ORDER BY ordinal_position
    `);
    console.log('leave_requests table structure:', structure.rows);

    // Check if there's any data in leave_requests
    const data = await pool.query(`
      SELECT * FROM leave_requests WHERE employee_id = 7 LIMIT 3
    `);
    console.log('Sample leave_requests data:', data.rows);

    // Check leave_types table structure
    const leaveTypesStructure = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'leave_types'
      ORDER BY ordinal_position
    `);
    console.log('leave_types table structure:', leaveTypesStructure.rows);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkLeaveRequestsStructure();