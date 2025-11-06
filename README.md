# Working Time & Absence System - API Layer

## Project Overview
This Node.js API provides secure backend integration for the Next.js frontend in the Working Time & Absence Management System. It implements Row-Level Security (RLS), JWT authentication, and multi-tenant architecture.

## Architecture
- **Database**: PostgreSQL with Row-Level Security (RLS)
- **API Framework**: Node.js with Express
- **Authentication**: JWT with secure session management
- **Security**: Parameterized queries, audit logging, tenant isolation

## API Endpoints

### 1. GET /api/me/daily
Retrieves daily work time data for the authenticated employee.
- **Authentication**: JWT required
- **Security**: Tenant isolation via RLS
- **Response**: Daily work time view data

### 2. POST /api/me/time-entry
Creates a new time entry for the authenticated employee.
- **Authentication**: JWT required
- **Security**: RLS policies enforced
- **Payload**: Time entry data

### 3. GET /api/me/vacation-balance
Retrieves vacation balance and entitlement for the authenticated employee.
- **Authentication**: JWT required
- **Security**: Tenant-specific data only
- **Response**: Vacation balance view data

## Security Features
- JWT token validation with claims extraction
- Row-Level Security (RLS) enforcement
- Session variables (app.tenant_id, app.user_id, app.role)
- Parameterized queries only (no dynamic SQL)
- Comprehensive audit logging
- Multi-tenant data isolation

## Setup Instructions
1. Install dependencies: `npm install`
2. Configure environment variables
3. Run database migrations
4. Start the API server: `npm start`

## Testing
- Seed data includes 2 tenants, 3 roles, 3 employees
- Positive and negative test cases for tenant isolation
- Role-based access control testing

## Documentation
Complete API documentation with example requests, responses, and JWT tokens included.