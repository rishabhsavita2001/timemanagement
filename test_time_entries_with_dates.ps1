# Test the time entries endpoint with real dates instead of shell variables
$loginBody = @{
    email = "jane.smith@company.com"
    password = "SecurePass@456"
} | ConvertTo-Json

Write-Host "Logging in..." -ForegroundColor Yellow

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3002/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.data.token
    Write-Host "Login successful!" -ForegroundColor Green
    
    # Test time entries endpoint with real dates
    $headers = @{ Authorization = "Bearer $token" }
    
    Write-Host "Testing time entries with real dates..." -ForegroundColor Yellow
    $url = "http://localhost:3002/api/me/time-entries?startDate=2025-11-01&endDate=2025-11-30&limit=100"
    $timeEntriesResponse = Invoke-RestMethod -Uri $url -Method GET -Headers $headers
    Write-Host "Time entries API Success!" -ForegroundColor Green
    $timeEntriesResponse | ConvertTo-Json -Depth 3
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody" -ForegroundColor Red
    }
}