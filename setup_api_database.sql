-- =====================================================================================
-- Essential Database Tables for Time Management API
-- =====================================================================================
-- This script creates the minimum required tables for the API to work with real data
-- Run this script to replace mock data with actual database functionality
-- =====================================================================================

\echo 'Setting up essential tables for Time Management API...'

-- Enable UUID extension for ID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================================
-- 1. TENANTS TABLE (Multi-tenant support)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default tenant if none exists
INSERT INTO tenants (id, name) 
SELECT 1, 'Swiss Company Ltd'
WHERE NOT EXISTS (SELECT 1 FROM tenants WHERE id = 1);

-- =====================================================================================
-- 2. USERS TABLE (Updated to match API expectations)
-- =====================================================================================
-- Note: This matches the API's user authentication system
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id) DEFAULT 1,
    employee_number VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100),
    password_hash VARCHAR(255),
    phone VARCHAR(50),
    hire_date DATE DEFAULT CURRENT_DATE,
    birth_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    role VARCHAR(50) DEFAULT 'employee',
    last_login TIMESTAMP WITH TIME ZONE,
    version INTEGER DEFAULT 1,
    created_by INTEGER,
    updated_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================================
-- 3. TIME ENTRIES TABLE (Core time tracking)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS time_entries (
    time_entry_id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES users(id) NOT NULL, -- Links to users table
    entry_date DATE NOT NULL,
    clock_in TIME,
    clock_out TIME,
    break_duration INTEGER DEFAULT 0, -- in minutes
    total_hours DECIMAL(4,2),
    notes TEXT,
    project_id INTEGER,
    task_id INTEGER,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, entry_date) -- One entry per employee per day
);

-- =====================================================================================
-- 4. LEAVE TYPES TABLE
-- =====================================================================================
CREATE TABLE IF NOT EXISTS leave_types (
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
);

-- Insert default leave types
INSERT INTO leave_types (leave_type_name, description, is_paid, max_days_per_year, requires_approval, advance_notice_days) VALUES
('Annual Leave', 'Regular vacation days', TRUE, 25, TRUE, 14),
('Sick Leave', 'Medical leave', TRUE, NULL, FALSE, 0),
('Personal Leave', 'Personal time off', FALSE, 5, TRUE, 7),
('Maternity Leave', 'Maternity leave', TRUE, 98, TRUE, 30),
('Paternity Leave', 'Paternity leave', TRUE, 10, TRUE, 14)
ON CONFLICT DO NOTHING;

-- =====================================================================================
-- 5. LEAVE REQUESTS TABLE
-- =====================================================================================
CREATE TABLE IF NOT EXISTS leave_requests (
    leave_request_id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES users(id) NOT NULL,
    leave_type_id INTEGER REFERENCES leave_types(leave_type_id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, cancelled
    is_half_day BOOLEAN DEFAULT FALSE,
    half_day_period VARCHAR(10), -- morning, afternoon
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================================
-- 6. VACATION BALANCES TABLE
-- =====================================================================================
CREATE TABLE IF NOT EXISTS vacation_balances (
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
);

-- =====================================================================================
-- 7. PROJECTS TABLE (For time tracking)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS projects (
    project_id SERIAL PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    tenant_id INTEGER REFERENCES tenants(id) DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample projects
INSERT INTO projects (project_name, description, start_date, end_date) VALUES
('Swiss HR System', 'Complete HR management system for Swiss companies', '2025-01-01', '2025-12-31'),
('Time Management API', 'RESTful API for time tracking and leave management', '2025-10-01', '2025-11-30'),
('Database Migration', 'Migrate legacy systems to PostgreSQL', '2025-09-01', '2025-12-31')
ON CONFLICT DO NOTHING;

-- =====================================================================================
-- 8. TASKS TABLE (For project tasks)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS tasks (
    task_id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(project_id),
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    estimated_hours DECIMAL(6,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample tasks
INSERT INTO tasks (project_id, task_name, description, estimated_hours) VALUES
(1, 'Database Design', 'Design PostgreSQL schema for HR system', 40.0),
(1, 'API Development', 'Develop RESTful API endpoints', 80.0),
(1, 'Frontend Integration', 'Integrate API with Next.js frontend', 60.0),
(2, 'Authentication System', 'JWT-based authentication', 24.0),
(2, 'Time Tracking Module', 'Core time tracking functionality', 32.0),
(2, 'Leave Management', 'Leave request and approval system', 28.0),
(3, 'Data Analysis', 'Analyze existing data structure', 16.0),
(3, 'Migration Scripts', 'Write data migration scripts', 24.0),
(3, 'Testing & Validation', 'Test migrated data integrity', 20.0)
ON CONFLICT DO NOTHING;

-- =====================================================================================
-- 9. CREATE INDEXES FOR PERFORMANCE
-- =====================================================================================
CREATE INDEX IF NOT EXISTS idx_time_entries_employee_date ON time_entries(employee_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_vacation_balances_employee_year ON vacation_balances(employee_id, year);

-- =====================================================================================
-- 10. CREATE SAMPLE USER FOR TESTING
-- =====================================================================================
-- This creates the user that matches your API authentication tests
INSERT INTO users (
    tenant_id, 
    employee_number, 
    first_name, 
    last_name, 
    email, 
    username,
    password_hash, -- This is bcrypt hash for "SecurePass@456"
    phone,
    hire_date,
    role
) VALUES (
    1,
    'EMP007',
    'Jane',
    'Smith',
    'jane.smith@company.com',
    'jane.smith',
    '$2b$10$8K.qEd5ij/ZkMl6YnZlrKuRFJ2aRZ3eNdEeZ9gD.Y8YnJHNqlq9aW', 
    '+41 79 123 45 67',
    '2023-01-15',
    'employee'
) ON CONFLICT (email) DO UPDATE SET
    password_hash = '$2b$10$8K.qEd5ij/ZkMl6YnZlrKuRFJ2aRZ3eNdEeZ9gD.Y8YnJHNqlq9aW',
    updated_at = NOW();

-- =====================================================================================
-- 11. CREATE INITIAL VACATION BALANCE FOR TEST USER
-- =====================================================================================
INSERT INTO vacation_balances (employee_id, year, vacation_days_total, vacation_days_used, vacation_days_remaining, sick_days_used)
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
    sick_days_used = 2.0;

-- =====================================================================================
-- 12. CREATE SAMPLE TIME ENTRIES FOR TESTING
-- =====================================================================================
INSERT INTO time_entries (employee_id, entry_date, clock_in, clock_out, break_duration, total_hours, notes, project_id, task_id)
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
    task_id = 2;

-- =====================================================================================
-- 13. CREATE SAMPLE LEAVE REQUEST
-- =====================================================================================
INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, reason, status)
SELECT 
    u.id,
    1, -- Annual Leave
    '2025-11-20'::DATE,
    '2025-11-22'::DATE,
    'Vacation',
    'pending'
FROM users u 
WHERE u.email = 'jane.smith@company.com'
ON CONFLICT DO NOTHING;

-- =====================================================================================
-- COMPLETION MESSAGE
-- =====================================================================================
\echo ''
\echo '✅ Essential database tables created successfully!'
\echo ''
\echo 'Created tables:'
\echo '- tenants (multi-tenant support)'
\echo '- users (authentication and user management)'
\echo '- time_entries (time tracking)'
\echo '- leave_types (leave categories)'
\echo '- leave_requests (leave management)'
\echo '- vacation_balances (vacation tracking)'
\echo '- projects (project management)'
\echo '- tasks (task tracking)'
\echo ''
\echo 'Sample data created:'
\echo '- Test user: jane.smith@company.com (password: SecurePass@456)'
\echo '- Sample projects and tasks'
\echo '- Sample time entries and leave requests'
\echo ''
\echo '🚀 Your API is now ready to work with real database data!'
\echo 'You can now remove the mock data from your API routes.'