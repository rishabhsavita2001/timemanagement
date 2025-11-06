$body = @{
    query = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3002/test-db" -Method POST -Body $body -ContentType "application/json"
    Write-Host "Tables in database:" -ForegroundColor Green
    $response.data | ForEach-Object { Write-Host "- $($_.table_name)" }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}