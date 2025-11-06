require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

async function testAuthenticationFix() {
  console.log('🧪 Testing authentication fix...\n');
  
  try {
    // First, let's try to login to get a fresh token
    console.log('1. Testing login to get fresh token...');
    const loginData = {
      email: 'jane.smith@company.com',
      password: 'SecurePass@456'
    };
    
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    console.log('✅ Login successful');
    console.log('Token received:', loginResponse.data.data.token.substring(0, 50) + '...');
    
    const token = loginResponse.data.data.token;
    
    // Now test the /api/me endpoint with the fresh token
    console.log('\n2. Testing /api/me endpoint with fresh token...');
    const profileResponse = await axios.get(`${BASE_URL}/api/me`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ /api/me endpoint successful!');
    console.log('User profile:', JSON.stringify(profileResponse.data, null, 2));
    
    console.log('\n🎉 Authentication fix successful! The /api/me endpoint now works correctly.');
    
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', {
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Server not running. Please start the server first.');
    } else {
      console.error('❌ Network Error:', error.message);
    }
  }
}

// Wait a moment for server to be ready, then test
setTimeout(testAuthenticationFix, 3000);