# PowerShell Script to Apply Supabase Migration
# This script applies the app version migration to Supabase database

$SUPABASE_URL = "https://gnpdhisyxwqvnjleyola.supabase.co"
$SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImducGRoaXN5eHdxdm5qbGV5b2xhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDU4NzIyNSwiZXhwIjoyMDUwMTYzMjI1fQ.9iV5ioLiWZ-P8XB4sVB4zmjhXc-rU-PIDzf9D-9Ezpw"

Write-Host "🚀 Applying app version migration to Supabase..." -ForegroundColor Cyan
Write-Host ""

# Read the SQL file
$sqlContent = Get-Content "d:\The Cheeze Town\supabase\migrations\20251227000000_create_app_versions.sql" -Raw

# Escape the SQL for JSON
$escapedSql = $sqlContent -replace '\\', '\\' -replace '"', '\"' -replace "`n", '\n' -replace "`r", ''

# Create JSON payload
$jsonPayload = @{
    query = $escapedSql
} | ConvertTo-Json -Compress

Write-Host "📦 Executing SQL migration..." -ForegroundColor Yellow

try {
    # Execute via Supabase REST API
    $response = Invoke-RestMethod `
        -Uri "$SUPABASE_URL/rest/v1/rpc/exec_sql" `
        -Method Post `
        -Headers @{
            "apikey" = $SERVICE_KEY
            "Authorization" = "Bearer $SERVICE_KEY"
            "Content-Type" = "application/json"
        } `
        -Body $jsonPayload
    
    Write-Host "✅ Migration applied successfully!" -ForegroundColor Green
    Write-Host "✨ Update system is now ready to use!" -ForegroundColor Green
}
catch {
    Write-Host "⚠️ Direct execution not available" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📝 Please apply the migration manually:" -ForegroundColor Cyan
    Write-Host "1. Open: https://supabase.com/dashboard/project/gnpdhisyxwqvnjleyola/sql" -ForegroundColor White
    Write-Host "2. Click 'New query'" -ForegroundColor White
    Write-Host "3. Copy and paste the SQL from:" -ForegroundColor White
    Write-Host "   d:\The Cheeze Town\supabase\migrations\20251227000000_create_app_versions.sql" -ForegroundColor White
    Write-Host "4. Click 'Run'" -ForegroundColor White
    Write-Host ""
    Write-Host "Or run this simplified SQL:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host $sqlContent -ForegroundColor Gray
}
