# Quick Token Retrieval Script
# Usage: .\get-tokens.ps1

param(
    [string]$BaseUrl = "http://localhost:3000"
)

Write-Host "🔑 Token Retrieval Helper" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

Write-Host "`n📋 Step-by-Step Token Retrieval:" -ForegroundColor Yellow

Write-Host "`n1️⃣  Start the development server:" -ForegroundColor Green
Write-Host "   npm run dev" -ForegroundColor Gray

Write-Host "`n2️⃣  Get Admin Token:" -ForegroundColor Green
Write-Host "   a) Go to: $BaseUrl/admin/login" -ForegroundColor Gray
Write-Host "   b) Sign in with admin credentials" -ForegroundColor Gray
Write-Host "   c) Go to: $BaseUrl/api/debug/token" -ForegroundColor Gray
Write-Host "   d) Copy the token from the response" -ForegroundColor Gray

Write-Host "`n3️⃣  Get User Token:" -ForegroundColor Green
Write-Host "   a) Go to: $BaseUrl/login" -ForegroundColor Gray
Write-Host "   b) Sign in with Google account" -ForegroundColor Gray
Write-Host "   c) Go to: $BaseUrl/api/debug/token" -ForegroundColor Gray
Write-Host "   d) Copy the token from the response" -ForegroundColor Gray

Write-Host "`n4️⃣  Run the comprehensive test:" -ForegroundColor Green
Write-Host "   .\scripts\test-phase2-endpoints.ps1 -AdminToken 'your_admin_token' -UserToken 'your_user_token'" -ForegroundColor Gray

Write-Host "`n5️⃣  Or test individual endpoints:" -ForegroundColor Green
Write-Host "   # Test health check" -ForegroundColor Gray
Write-Host "   curl $BaseUrl/api/health" -ForegroundColor Gray
Write-Host ""
Write-Host "   # Create seed data (admin only)" -ForegroundColor Gray
Write-Host "   curl -X POST $BaseUrl/api/admin/seed.dev \\" -ForegroundColor Gray
Write-Host "     -H 'Authorization: Bearer YOUR_ADMIN_TOKEN' \\" -ForegroundColor Gray
Write-Host "     -H 'Content-Type: application/json'" -ForegroundColor Gray

Write-Host "`n💡 Pro Tips:" -ForegroundColor Yellow
Write-Host "   • Keep tokens in a secure place (they expire)" -ForegroundColor Gray
Write-Host "   • Admin tokens work for all admin endpoints" -ForegroundColor Gray
Write-Host "   • User tokens only work for user endpoints" -ForegroundColor Gray
Write-Host "   • Tokens are JWT format and contain role information" -ForegroundColor Gray

Write-Host "`n🌐 Useful URLs:" -ForegroundColor Cyan
Write-Host "   Dashboard (logged in):     $BaseUrl/dashboard" -ForegroundColor Gray
Write-Host "   Catalog (public):          $BaseUrl/catalog" -ForegroundColor Gray
Write-Host "   Admin panel:               $BaseUrl/admin" -ForegroundColor Gray
Write-Host "   Token debug:               $BaseUrl/api/debug/token" -ForegroundColor Gray
Write-Host "   Health check:              $BaseUrl/api/health" -ForegroundColor Gray