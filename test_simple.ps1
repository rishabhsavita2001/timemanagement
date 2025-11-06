# Test Dashboard API - Complete Workflow
Write-Host "Testing Dashboard API with proper authentication..." -ForegroundColor Green

# Step 1: Login
$loginBody = @{
    email = "jane.smith@company.com"
    password = "SecurePass@456"
} | ConvertTo-Json

Write-Host "Step 1: Logging in..." -ForegroundColor Yellow

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3002/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.data.token
    Write-Host "Login successful! Token: $($token.Substring(0,50))..." -ForegroundColor Green
    
    # Step 2: Use token for dashboard
    Write-Host "Step 2: Testing dashboard with token..." -ForegroundColor Yellow
    $headers = @{ Authorization = "Bearer $token" }
    
    $dashboardResponse = Invoke-RestMethod -Uri "http://localhost:3002/api/me/dashboard" -Method GET -Headers $headers
    Write-Host "Dashboard API Success!" -ForegroundColor Green
    $dashboardResponse | ConvertTo-Json -Depth 3
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}