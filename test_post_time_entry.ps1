# Test POST time entry endpoint
$headers = @{
    'Content-Type' = 'application/json'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjcsInRlbmFudElkIjoxLCJlbWFpbCI6ImphbmUuc21pdGhAY29tcGFueS5jb20iLCJpYXQiOjE3NjI0MTc1MDEsImV4cCI6MTc2MjQ0NjMwMSwiYXVkIjoid29ya2luZy10aW1lLWNsaWVudCIsImlzcyI6IndvcmtpbmctdGltZS1hcGkifQ.pOP6P3rAZh-os1eB5bGkiTd5Z_GlfrID9LVRJknza3U'
}

$body = @{
    date = "2025-11-05"
    clockIn = "09:00"
    clockOut = "17:00"
    breakDuration = 60
    notes = "Regular work day - API development"
    projectId = 1
    taskId = 5
} | ConvertTo-Json

Write-Host "Testing POST time entry..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3002/api/me/time-entries" -Method POST -Headers $headers -Body $body
    Write-Host "✅ POST time entry successful!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody" -ForegroundColor Red
    }
}