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

async function checkVacationBalances() {
  try {
    // Check vacation_balances table
    const vacationBalances = await pool.query(`
      SELECT * FROM vacation_balances 
      WHERE employee_id = 7 AND year = 2025
    `);
    console.log('vacation_balances data:', vacationBalances.rows);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkVacationBalances();