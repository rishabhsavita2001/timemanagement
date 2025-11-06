# Test simple API endpoint
$loginBody = @{
    email = "jane.smith@company.com"
    password = "SecurePass@456"
} | ConvertTo-Json

Write-Host "Logging in..." -ForegroundColor Yellow

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3002/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.data.token
    Write-Host "Login successful!" -ForegroundColor Green
    
    # Test simple endpoint
    $headers = @{ Authorization = "Bearer $token" }
    $testResponse = Invoke-RestMethod -Uri "http://localhost:3002/api/test" -Method GET -Headers $headers
    Write-Host "Test endpoint response:" -ForegroundColor Green
    $testResponse | ConvertTo-Json -Depth 3
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody" -ForegroundColor Red
    }
}