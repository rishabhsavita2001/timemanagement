# Test Leave Requests API
$loginBody = @{
    email = "jane.smith@company.com"
    password = "SecurePass@456"
} | ConvertTo-Json

Write-Host "Logging in..." -ForegroundColor Yellow

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3002/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.data.token
    Write-Host "Login successful!" -ForegroundColor Green
    
    # Test leave requests endpoint
    Write-Host "Testing leave requests endpoint..." -ForegroundColor Yellow
    $headers = @{ Authorization = "Bearer $token" }
    
    $leaveResponse = Invoke-RestMethod -Uri "http://localhost:3002/api/me/leave-requests?page=1&limit=10&sortOrder=desc" -Method GET -Headers $headers
    Write-Host "Leave requests API Success!" -ForegroundColor Green
    $leaveResponse | ConvertTo-Json -Depth 3
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody" -ForegroundColor Red
    }
}