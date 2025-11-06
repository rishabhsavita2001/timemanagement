// Simple API test using Node.js
const http = require('http');

async function testAPI() {
  console.log('🧪 Testing API endpoints...\n');
  
  // Test registration
  const regData = JSON.stringify({
    email: "test.user@company.com",
    password: "SecurePass@789",
    firstName: "Test",
    lastName: "User",
    employeeNumber: "EMP003",
    tenantId: 1
  });
  
  console.log('1️⃣ Testing Registration...');
  try {
    const regResult = await makeRequest('POST', '/auth/register', regData);
    console.log('✅ Registration Success:', regResult);
  } catch (error) {
    console.log('❌ Registration Failed:', error.message);
  }
  
  // Test login
  const loginData = JSON.stringify({
    email: "test.user@company.com", 
    password: "SecurePass@789"
  });
  
  console.log('\n2️⃣ Testing Login...');
  try {
    const loginResult = await makeRequest('POST', '/auth/login', loginData);
    console.log('✅ Login Success:', loginResult);
  } catch (error) {
    console.log('❌ Login Failed:', error.message);
  }
}

function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch (error) {
          resolve(body);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

testAPI();