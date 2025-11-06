require('dotenv').config();

// Test the complete authentication workflow
async function testDashboardAPI() {
  console.log('🧪 Testing Complete Dashboard API Workflow...\n');
  
  try {
    // Step 1: Login to get a fresh JWT token
    console.log('1️⃣ Step 1: Login to get JWT token...');
    
    const loginBody = JSON.stringify({
      email: "jane.smith@company.com",
      password: "SecurePass@456"
    });
    
    // Simulate login request (using node-fetch alternative)
    const loginCommand = `
      $loginBody = '${loginBody}'
      $loginResult = Invoke-RestMethod -Uri "http://localhost:3002/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
      $token = $loginResult.data.token
      Write-Host "✅ Login successful! Token: $($token.Substring(0,50))..."
      
      # Step 2: Use the token for dashboard API
      Write-Host "2️⃣ Step 2: Testing dashboard API with fresh token..."
      $headers = @{Authorization="Bearer $token"}
      $dashboardResult = Invoke-RestMethod -Uri "http://localhost:3002/api/me/dashboard" -Method GET -Headers $headers
      Write-Host "✅ Dashboard API successful!"
      $dashboardResult | ConvertTo-Json -Depth 4
    `;
    
    console.log('PowerShell command to run:');
    console.log('----------------------------');
    console.log(loginCommand.trim());
    console.log('----------------------------\n');
    
    console.log('📋 Or use cURL with these steps:\n');
    
    console.log('Step 1 - Login:');
    console.log('curl -X POST http://localhost:3002/auth/login \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"email":"jane.smith@company.com","password":"SecurePass@456"}\'');
    
    console.log('\nStep 2 - Copy the token from login response and replace YOUR_JWT_TOKEN:');
    console.log('curl -X GET http://localhost:3002/api/me/dashboard \\');
    console.log('  -H "Authorization: Bearer PASTE_YOUR_ACTUAL_TOKEN_HERE"');
    
    console.log('\n🎯 The key issue: You must replace YOUR_JWT_TOKEN with the actual token from login response!');
    
  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
  }
}

testDashboardAPI();