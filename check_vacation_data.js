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

async function checkVacationData() {
  try {
    // Check if vacation_balances table exists
    const tableCheck = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%vacation%' OR table_name LIKE '%leave%'
    `);
    console.log('Tables with vacation/leave:', tableCheck.rows);

    // Check if employee_leave_balances exists (from the SQL files)
    const employeeLeaveCheck = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'employee_leave_balances'
    `);
    
    if (employeeLeaveCheck.rows.length > 0) {
      console.log('employee_leave_balances table exists!');
      
      // Check data in employee_leave_balances
      const data = await pool.query(`
        SELECT * FROM employee_leave_balances 
        WHERE employee_id = 7 AND year = 2025 
        LIMIT 5
      `);
      console.log('Employee leave balances data:', data.rows);
    }

    // Check if there's sample data
    const users = await pool.query('SELECT id, email FROM users LIMIT 3');
    console.log('Users in database:', users.rows);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkVacationData();