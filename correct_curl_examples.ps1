# CORRECTED CURL COMMANDS for Time Entries API

Write-Host "Here are the CORRECT curl commands to use:" -ForegroundColor Green

Write-Host "`n1. ISO Format (YYYY-MM-DD) - RECOMMENDED:" -ForegroundColor Yellow
Write-Host 'curl --location "http://localhost:3002/api/me/time-entries?startDate=2025-11-01&endDate=2025-11-30&limit=100" \' -ForegroundColor White
Write-Host '--header "Authorization: Bearer YOUR_JWT_TOKEN"' -ForegroundColor White

Write-Host "`n2. US Format (MM/DD/YYYY):" -ForegroundColor Yellow  
Write-Host 'curl --location "http://localhost:3002/api/me/time-entries?startDate=11/01/2025&endDate=11/30/2025&limit=100" \' -ForegroundColor White
Write-Host '--header "Authorization: Bearer YOUR_JWT_TOKEN"' -ForegroundColor White

Write-Host "`n3. European Format (DD/MM/YYYY):" -ForegroundColor Yellow
Write-Host 'curl --location "http://localhost:3002/api/me/time-entries?startDate=01/11/2025&endDate=30/11/2025&limit=100" \' -ForegroundColor White
Write-Host '--header "Authorization: Bearer YOUR_JWT_TOKEN"' -ForegroundColor White

Write-Host "`n4. Dash Format (DD-MM-YYYY):" -ForegroundColor Yellow
Write-Host 'curl --location "http://localhost:3002/api/me/time-entries?startDate=01-11-2025&endDate=30-11-2025&limit=100" \' -ForegroundColor White
Write-Host '--header "Authorization: Bearer YOUR_JWT_TOKEN"' -ForegroundColor White

Write-Host "`n❌ WRONG (what you're using now):" -ForegroundColor Red
Write-Host 'startDate=%24ST10%2F10%2F2015ART_DATE  # This decodes to: $ST10/10/2015ART_DATE' -ForegroundColor DarkRed
Write-Host 'endDate=%2412%2F10%2F2025             # This decodes to: $12/10/2025' -ForegroundColor DarkRed

Write-Host "`n✅ KEY POINTS:" -ForegroundColor Cyan
Write-Host "- Use actual dates, not shell variables like `$START_DATE" -ForegroundColor White
Write-Host "- Don't URL-encode manually - curl handles this automatically" -ForegroundColor White  
Write-Host "- Use quotes around the URL to prevent shell interpretation" -ForegroundColor White
Write-Host "- Replace YOUR_JWT_TOKEN with your actual token" -ForegroundColor White

Write-Host "`n🧪 TESTING WITH YOUR ACTUAL TOKEN:" -ForegroundColor Green
$actualToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjcsInRlbmFudElkIjoxLCJlbWFpbCI6ImphbmUuc21pdGhAY29tcGFueS5jb20iLCJpYXQiOjE3NjI0MTc1MDEsImV4cCI6MTc2MjQ0NjMwMSwiYXVkIjoid29ya2luZy10aW1lLWNsaWVudCIsImlzcyI6IndvcmtpbmctdGltZS1hcGkifQ.pOP6P3rAZh-os1eB5bGkiTd5Z_GlfrID9LVRJknza3U"

try {
    $headers = @{ Authorization = "Bearer $actualToken" }
    
    Write-Host "Testing ISO format: 2025-11-01 to 2025-11-30..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "http://localhost:3002/api/me/time-entries?startDate=2025-11-01&endDate=2025-11-30&limit=100" -Method GET -Headers $headers
    
    Write-Host "✅ SUCCESS! API responded correctly:" -ForegroundColor Green
    Write-Host "- Total entries found: $($response.data.entries.Count)" -ForegroundColor White
    Write-Host "- Pagination info: Page $($response.data.pagination.page) of $($response.data.pagination.totalPages)" -ForegroundColor White
    
    if ($response.data.entries.Count -gt 0) {
        Write-Host "- First entry date: $($response.data.entries[0].entry_date)" -ForegroundColor White
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}