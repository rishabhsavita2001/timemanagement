# Test Multiple Date Formats - Time Entry API
Write-Host "Testing flexible date formats for time entry API..." -ForegroundColor Green

# Login first to get token
$loginBody = @{
    email = "jane.smith@company.com"
    password = "SecurePass@456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3002/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.data.token
    Write-Host "✅ Login successful!" -ForegroundColor Green
    
    $headers = @{ Authorization = "Bearer $token" }
    
    # Test different date formats
    $dateFormats = @(
        @{ format = "ISO (YYYY-MM-DD)"; date = "2025-11-06" },
        @{ format = "US (MM/DD/YYYY)"; date = "11/06/2025" },
        @{ format = "European (DD/MM/YYYY)"; date = "06/11/2025" },
        @{ format = "Dash (DD-MM-YYYY)"; date = "06-11-2025" }
    )
    
    foreach ($test in $dateFormats) {
        Write-Host "`n🧪 Testing $($test.format): $($test.date)" -ForegroundColor Yellow
        
        $body = @{
            date = $test.date
            clockIn = "09:00"
            clockOut = "17:00"
            breakDuration = 60
            notes = "Testing $($test.format) date format"
            projectId = 1
            taskId = 5
        } | ConvertTo-Json
        
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:3002/api/me/time-entries" -Method POST -Body $body -ContentType "application/json" -Headers $headers
            Write-Host "✅ SUCCESS: $($test.format) format accepted" -ForegroundColor Green
            Write-Host "   Response: $($response.message)" -ForegroundColor Gray
        }
        catch {
            Write-Host "❌ FAILED: $($test.format) format rejected" -ForegroundColor Red
            Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
}