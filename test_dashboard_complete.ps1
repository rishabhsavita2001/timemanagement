Write-Host "🔐 Step 1: Login to get JWT token..." -ForegroundColor Green

$loginBody = '{"email":"jane.smith@company.com","password":"SecurePass@456"}'

try {
    $loginResult = Invoke-RestMethod -Uri "http://localhost:3002/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -TimeoutSec 10
    $token = $loginResult.data.token
    
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "🪙 JWT Token received: $($token.Substring(0,50))..." -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "🎯 Step 2: Testing dashboard API with REAL token..." -ForegroundColor Green
    $headers = @{Authorization="Bearer $token"}
    
    $dashboardResult = Invoke-RestMethod -Uri "http://localhost:3002/api/me/dashboard" -Method GET -Headers $headers -TimeoutSec 10
    
    Write-Host "✅ Dashboard API SUCCESS!" -ForegroundColor Green
    Write-Host "📊 Dashboard Response:" -ForegroundColor Cyan
    $dashboardResult | ConvertTo-Json -Depth 4
    
}
catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Message -like "*Unable to connect*") {
        Write-Host "💡 Server might not be running. Make sure the server is started first." -ForegroundColor Yellow
    }
}