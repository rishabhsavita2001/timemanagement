const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  console.log('🚀 Setting up database tables for Time Management API...\n');
  
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('📡 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!\n');

    // Execute SQL commands individually for better control
    const commands = [
      // 1. Create tenants table
      {
        name: 'tenants table',
        sql: `CREATE TABLE IF NOT EXISTS tenants (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
      },
      
      // 2. Insert default tenant
      {
        name: 'default tenant',
        sql: `INSERT INTO tenants (id, name) 
              SELECT 1, 'Swiss Company Ltd'
              WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE id = 1)`
      },

      // 3. Create time_entries table  
      {
        name: 'time_entries table',
        sql: `CREATE TABLE IF NOT EXISTS time_entries (
          time_entry_id SERIAL PRIMARY KEY,
          employee_id INTEGER REFERENCES users(id) NOT NULL,
          entry_date DATE NOT NULL,
          clock_in TIME,
          clock_out TIME,
          break_duration INTEGER DEFAULT 0,
          total_hours DECIMAL(4,2),
          notes TEXT,
          project_id INTEGER,
          task_id INTEGER,
          is_approved BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(employee_id, entry_date)
        )`
      },

      // 4. Create leave_types table
      {
        name: 'leave_types table',
        sql: `CREATE TABLE IF NOT EXISTS leave_types (
          leave_type_id SERIAL PRIMARY KEY,
          leave_type_name VARCHAR(100) NOT NULL,
          description TEXT,
          is_paid BOOLEAN DEFAULT TRUE,
          max_days_per_year INTEGER,
          requires_approval BOOLEAN DEFAULT TRUE,
          advance_notice_days INTEGER DEFAULT 0,
          tenant_id INTEGER REFERENCES tenants(id) DEFAULT 1,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
      },

      // 5. Insert default leave types
      {
        name: 'default leave types',
        sql: `INSERT INTO leave_types (leave_type_name, description, is_paid, max_days_per_year, requires_approval, advance_notice_days) 
              SELECT * FROM (VALUES
                ('Annual Leave', 'Regular vacation days', TRUE, 25, TRUE, 14),
                ('Sick Leave', 'Medical leave', TRUE, NULL, FALSE, 0),
                ('Personal Leave', 'Personal time off', FALSE, 5, TRUE, 7),
                ('Maternity Leave', 'Maternity leave', TRUE, 98, TRUE, 30),
                ('Paternity Leave', 'Paternity leave', TRUE, 10, TRUE, 14)
              ) AS v(leave_type_name, description, is_paid, max_days_per_year, requires_approval, advance_notice_days)
              WHERE NOT EXISTS (SELECT 1 FROM leave_types)`
      },

      // 6. Create vacation_balances table
      {
        name: 'vacation_balances table',
        sql: `CREATE TABLE IF NOT EXISTS vacation_balances (
          id SERIAL PRIMARY KEY,
          employee_id INTEGER REFERENCES users(id) NOT NULL,
          year INTEGER NOT NULL,
          vacation_days_total DECIMAL(4,1) DEFAULT 25.0,
          vacation_days_used DECIMAL(4,1) DEFAULT 0.0,
          vacation_days_remaining DECIMAL(4,1) DEFAULT 25.0,
          sick_days_used DECIMAL(4,1) DEFAULT 0.0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(employee_id, year)
        )`
      },

      // 7. Create projects table
      {
        name: 'projects table',
        sql: `CREATE TABLE IF NOT EXISTS projects (
          project_id SERIAL PRIMARY KEY,
          project_name VARCHAR(255) NOT NULL,
          description TEXT,
          tenant_id INTEGER REFERENCES tenants(id) DEFAULT 1,
          is_active BOOLEAN DEFAULT TRUE,
          start_date DATE,
          end_date DATE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
      },

      // 8. Insert sample projects
      {
        name: 'sample projects',
        sql: `INSERT INTO projects (project_name, description, start_date, end_date) 
              SELECT * FROM (VALUES
                ('Swiss HR System', 'Complete HR management system for Swiss companies', '2025-01-01'::DATE, '2025-12-31'::DATE),
                ('Time Management API', 'RESTful API for time tracking and leave management', '2025-10-01'::DATE, '2025-11-30'::DATE),
                ('Database Migration', 'Migrate legacy systems to PostgreSQL', '2025-09-01'::DATE, '2025-12-31'::DATE)
              ) AS v(project_name, description, start_date, end_date)
              WHERE NOT EXISTS (SELECT 1 FROM projects)`
      },

      // 9. Create tasks table
      {
        name: 'tasks table',
        sql: `CREATE TABLE IF NOT EXISTS tasks (
          task_id SERIAL PRIMARY KEY,
          project_id INTEGER REFERENCES projects(project_id),
          task_name VARCHAR(255) NOT NULL,
          description TEXT,
          estimated_hours DECIMAL(6,2),
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
      },

      // 10. Create indexes
      {
        name: 'database indexes',
        sql: `CREATE INDEX IF NOT EXISTS idx_time_entries_employee_date ON time_entries(employee_id, entry_date);
              CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(entry_date);
              CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
              CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
              CREATE INDEX IF NOT EXISTS idx_vacation_balances_employee_year ON vacation_balances(employee_id, year)`
      },

      // 11. Create vacation balance for test user
      {
        name: 'test user vacation balance',
        sql: `INSERT INTO vacation_balances (employee_id, year, vacation_days_total, vacation_days_used, vacation_days_remaining, sick_days_used)
              SELECT 
                u.id,
                EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
                25.0,
                12.0,
                13.0,
                2.0
              FROM users u 
              WHERE u.email = 'jane.smith@company.com'
              ON CONFLICT (employee_id, year) DO UPDATE SET
                vacation_days_total = 25.0,
                vacation_days_used = 12.0,
                vacation_days_remaining = 13.0,
                sick_days_used = 2.0`
      },

      // 12. Create sample time entry
      {
        name: 'sample time entry',
        sql: `INSERT INTO time_entries (employee_id, entry_date, clock_in, clock_out, break_duration, total_hours, notes, project_id, task_id)
              SELECT 
                u.id,
                CURRENT_DATE - INTERVAL '1 day',
                '09:00:00'::TIME,
                '17:30:00'::TIME,
                60,
                7.5,
                'Working on Swiss HR System - API development',
                1,
                2
              FROM users u 
              WHERE u.email = 'jane.smith@company.com'
              ON CONFLICT (employee_id, entry_date) DO UPDATE SET
                clock_in = '09:00:00'::TIME,
                clock_out = '17:30:00'::TIME,
                break_duration = 60,
                total_hours = 7.5,
                notes = 'Working on Swiss HR System - API development',
                project_id = 1,
                task_id = 2`
      }
    ];

    let successCount = 0;
    for (const command of commands) {
      try {
        await pool.query(command.sql);
        console.log(`✅ Created: ${command.name}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error creating ${command.name}:`, error.message);
      }
    }

    console.log(`\n🎉 Database setup completed!`);
    console.log(`✅ ${successCount}/${commands.length} operations successful\n`);

    // Verify what we have
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('users', 'time_entries', 'leave_requests', 'projects', 'tasks', 'vacation_balances', 'leave_types')
      ORDER BY table_name
    `);

    console.log('📋 Available tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Check sample data
    const timeEntriesCount = await pool.query('SELECT COUNT(*) FROM time_entries');
    const projectsCount = await pool.query('SELECT COUNT(*) FROM projects');
    
    console.log(`\n📊 Sample data:`);
    console.log(`   - Time entries: ${timeEntriesCount.rows[0].count}`);
    console.log(`   - Projects: ${projectsCount.rows[0].count}`);

    console.log('\n🚀 Database is ready! Your API can now use real data instead of mock data.');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    await pool.end();
  }
}

setupDatabase().catch(console.error);