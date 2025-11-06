require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

async function testApiEndpoints() {
  console.log('🧪 Testing API endpoints after trigger fix...\n');
  
  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);
    console.log('');
    
    // Test 2: User registration
    console.log('2. Testing user registration...');
    const registerData = {
      email: 'john.doe@company.com',
      password: 'SecurePass@123',
      firstName: 'John',
      lastName: 'Doe',
      employeeNumber: 'EMP001',
      tenantId: 1
    };
    
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, registerData);
    console.log('✅ User registration successful:', registerResponse.data);
    console.log('');
    
    // Test 3: User login
    console.log('3. Testing user login...');
    const loginData = {
      email: 'john.doe@company.com',
      password: 'SecurePass@123'
    };
    
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    console.log('✅ User login successful:', loginResponse.data);
    console.log('');
    
    // Test 4: Get user profile (using token from login)
    console.log('4. Testing authenticated endpoint...');
    const token = loginResponse.data.access_token;
    const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Profile retrieval successful:', profileResponse.data);
    console.log('');
    
    console.log('🎉 All tests passed! The API is working correctly.');
    
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', {
        status: error.response.status,
        data: error.response.data
      });
    } else {
      console.error('❌ Network Error:', error.message);
    }
  }
}

testApiEndpoints();