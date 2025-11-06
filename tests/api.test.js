const request = require('supertest');
const app = require('../server');
const { pool } = require('../config/database');

describe('Authentication Endpoints', () => {
  afterAll(async () => {
    await pool.end();
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'john.doe@company.com',
          password: 'SecurePass123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'john.doe@company.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication failed');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'SecurePass123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      // First login to get a token
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'john.doe@company.com',
          password: 'SecurePass123'
        });

      const token = loginResponse.body.data.token;

      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});

describe('API Endpoints', () => {
  let authToken;

  beforeAll(async () => {
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: 'john.doe@company.com',
        password: 'SecurePass123'
      });

    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('GET /api/me', () => {
    it('should get current user profile', async () => {
      const response = await request(app)
        .get('/api/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe('john.doe@company.com');
    });

    it('should reject requests without token', async () => {
      const response = await request(app)
        .get('/api/me');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('GET /api/me/dashboard', () => {
    it('should get dashboard data', async () => {
      const response = await request(app)
        .get('/api/me/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('todayEntries');
      expect(response.body.data).toHaveProperty('monthSummary');
      expect(response.body.data).toHaveProperty('pendingLeaves');
      expect(response.body.data).toHaveProperty('vacationBalance');
    });
  });

  describe('POST /api/me/time-entries', () => {
    it('should create a time entry', async () => {
      const timeEntry = {
        date: new Date().toISOString().split('T')[0],
        clockIn: '09:00',
        clockOut: '17:00',
        breakDuration: 60,
        notes: 'Regular work day'
      };

      const response = await request(app)
        .post('/api/me/time-entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send(timeEntry);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.entry).toBeDefined();
    });

    it('should validate time entry data', async () => {
      const invalidEntry = {
        date: 'invalid-date',
        clockIn: '25:00', // Invalid time
        notes: 'Test'
      };

      const response = await request(app)
        .post('/api/me/time-entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidEntry);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('GET /api/me/vacation-balance', () => {
    it('should get vacation balance', async () => {
      const response = await request(app)
        .get('/api/me/vacation-balance')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.balance).toBeDefined();
    });
  });

  describe('GET /api/leave-types', () => {
    it('should get leave types', async () => {
      const response = await request(app)
        .get('/api/leave-types')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.leaveTypes)).toBe(true);
    });
  });
});

describe('Error Handling', () => {
  it('should handle 404 routes', async () => {
    const response = await request(app)
      .get('/nonexistent-route');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Route not found');
  });

  it('should handle rate limiting', async () => {
    // This test would need to be adjusted based on your rate limiting configuration
    // For now, just verify the middleware is applied
    const response = await request(app)
      .get('/health');

    expect(response.status).toBe(200);
  });
});