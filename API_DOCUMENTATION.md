# Working Time Management API

A comprehensive Node.js API for the Swiss HR Working Time & Absence Management System with multi-tenant support, JWT authentication, and PostgreSQL integration.

## 🚀 Features

- **JWT Authentication** - Secure token-based authentication
- **Multi-tenant Architecture** - Row-level security for data isolation
- **Time Tracking** - Clock in/out, break tracking, project assignments
- **Leave Management** - Vacation requests, sick leave, leave balances
- **Swiss Labor Law Compliance** - Working time regulations and holidays
- **Comprehensive API** - RESTful endpoints for frontend integration
- **Security First** - Rate limiting, input validation, audit logging
- **Production Ready** - Error handling, logging, testing

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL 14+ with the timemanagement database
- npm or yarn package manager

## ⚡ Quick Start

1. **Clone and Install**
```bash
git clone <repository-url>
cd api_layer
npm install
```

2. **Environment Configuration**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. **Start the Server**
```bash
# Development
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:3001`

## 🔧 Configuration

### Environment Variables (.env)

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Database Configuration (Scaleway PostgreSQL)
DB_HOST=51.158.210.40
DB_PORT=20044
DB_NAME=timemanagement
DB_USER=your_username
DB_PASSWORD=your_password
DB_SSL=true

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-256-bits
JWT_EXPIRES_IN=8h
JWT_ISSUER=working-time-api
JWT_AUDIENCE=working-time-client

# Security Configuration
BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_REQUESTS=100

# Logging Configuration
LOG_LEVEL=info
```

## 📚 API Documentation

### Authentication Endpoints

#### POST /auth/login
Login with email and password
```json
{
  "email": "john.doe@company.com",
  "password": "SecurePass123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "tenantId": 1,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@company.com"
    }
  }
}
```

#### POST /auth/logout
Logout (for audit logging)

#### POST /auth/refresh
Refresh JWT token

### User Profile Endpoints

#### GET /api/me
Get current user profile
```json
{
  "success": true,
  "data": {
    "user": {
      "employee_id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@company.com",
      "department_name": "Engineering",
      "position_title": "Software Developer"
    }
  }
}
```

#### GET /api/me/dashboard
Get dashboard summary data
```json
{
  "success": true,
  "data": {
    "todayEntries": [...],
    "monthSummary": {
      "days_worked": 20,
      "total_hours": 160,
      "avg_hours_per_day": 8
    },
    "pendingLeaves": [...],
    "vacationBalance": {
      "vacation_days_total": 25,
      "vacation_days_used": 5,
      "vacation_days_remaining": 20
    }
  }
}
```

### Time Tracking Endpoints

#### GET /api/me/time-entries
Get time entries with pagination
Query parameters:
- `page` (default: 1)
- `limit` (default: 20)
- `startDate` (ISO date)
- `endDate` (ISO date)

#### POST /api/me/time-entries
Create new time entry
```json
{
  "date": "2024-01-15",
  "clockIn": "09:00",
  "clockOut": "17:00",
  "breakDuration": 60,
  "notes": "Regular work day",
  "projectId": 1,
  "taskId": 5
}
```

#### PUT /api/me/time-entries/:id
Update existing time entry

#### DELETE /api/me/time-entries/:id
Delete time entry (if not approved)

### Leave Management Endpoints

#### GET /api/me/vacation-balance
Get current vacation balance

#### GET /api/me/leave-requests
Get leave requests with pagination

#### POST /api/me/leave-requests
Create new leave request
```json
{
  "leaveTypeId": 1,
  "startDate": "2024-02-01",
  "endDate": "2024-02-05",
  "reason": "Family vacation",
  "isHalfDay": false
}
```

### Reference Data Endpoints

#### GET /api/leave-types
Get available leave types

#### GET /api/projects
Get active projects for time tracking

#### GET /api/projects/:id/tasks
Get tasks for a specific project

## 🔒 Security Features

### JWT Authentication
- Secure token-based authentication
- Configurable expiration times
- Token refresh capability
- Automatic user validation

### Row-Level Security (RLS)
- Multi-tenant data isolation
- Session variables for context
- Automatic tenant filtering
- Secure data access

### Input Validation
- Joi schema validation
- Request body validation
- Parameter validation
- Query parameter validation

### Rate Limiting
- Configurable request limits
- IP-based rate limiting
- Protection against abuse

### Audit Logging
- User action logging
- Security event tracking
- Comprehensive audit trail

## 🧪 Testing

Run the test suite:
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Coverage
- Authentication flows
- API endpoints
- Error handling
- Validation logic
- Security features

## 📊 Database Integration

### Connection Management
- PostgreSQL connection pooling
- Connection health monitoring
- Automatic reconnection
- Transaction support

### Row-Level Security
```sql
-- Session variables are automatically set for each request
SET session.current_user_id = 123;
SET session.current_tenant_id = 1;
```

### Multi-tenant Queries
All database queries automatically include tenant isolation:
```javascript
const result = await executeWithRLS(query, params, userId, tenantId);
```

## 🔧 Development

### Project Structure
```
api_layer/
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   ├── auth.js              # JWT authentication
│   ├── errorHandler.js      # Error handling
│   ├── logger.js            # Request logging
│   └── validation.js        # Input validation
├── routes/
│   ├── auth.js              # Authentication routes
│   └── api.js               # Main API routes
├── tests/
│   └── api.test.js          # Test suite
├── logs/                    # Log files
├── server.js                # Main server file
├── package.json
└── README.md
```

### Adding New Endpoints

1. **Define validation schema** in `middleware/validation.js`
2. **Add route handler** in `routes/api.js`
3. **Implement database query** using `executeWithRLS`
4. **Add audit logging** for sensitive operations
5. **Write tests** in `tests/api.test.js`

### Error Handling
The API uses a centralized error handling system:
```javascript
const { asyncHandler } = require('../middleware/errorHandler');

router.get('/endpoint', asyncHandler(async (req, res) => {
  // Your code here - errors are automatically caught and handled
}));
```

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure secure JWT secret
- [ ] Enable SSL for database connection
- [ ] Set up proper CORS origins
- [ ] Configure rate limiting
- [ ] Set up log rotation
- [ ] Enable process monitoring

### Docker Deployment (Optional)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment-specific Configuration
- **Development**: Debug logging, CORS disabled
- **Staging**: Production-like with test data
- **Production**: Optimized settings, security hardened

## 📈 Monitoring

### Health Check
```bash
curl http://localhost:3001/health
```

### Logs
- **Error logs**: `logs/error.log`
- **Combined logs**: `logs/combined.log`
- **Console logs**: Development mode only

### Metrics
- Request duration
- Error rates
- Authentication events
- Database performance

## 🤝 Integration with Next.js Frontend

### API Client Setup
```javascript
// lib/api.js
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiClient = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }
};
```

### Authentication Context
```javascript
// contexts/AuthContext.js
export const useAuth = () => {
  const login = async (email, password) => {
    const response = await apiClient.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    localStorage.setItem('authToken', response.data.token);
    setUser(response.data.user);
  };
};
```

## 📞 Support

For technical support or questions:
- Check the API documentation above
- Review the test cases for usage examples
- Verify database connection and schema
- Check logs for detailed error information

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- Multi-tenant authentication system
- Complete time tracking API
- Leave management system
- Swiss labor law compliance
- Production-ready security features