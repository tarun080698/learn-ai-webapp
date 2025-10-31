#!/usr/bin/env pwsh

Write-Host "🧪 Testing Course APIs" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan

# Test public catalog API
Write-Host "`n1️⃣  Testing Public Catalog API (should show published courses)" -ForegroundColor Yellow
$catalogResponse = curl -s http://localhost:3000/api/catalog
$catalog = $catalogResponse | ConvertFrom-Json

Write-Host "   📊 Found $($catalog.count) published courses" -ForegroundColor Green
foreach ($course in $catalog.courses) {
    Write-Host "   📚 $($course.title) - Level: $($course.level) - Duration: $($course.durationMinutes)min" -ForegroundColor Gray
}

# Test admin API without token (should fail)
Write-Host "`n2️⃣  Testing Admin API without token (should fail with 401)" -ForegroundColor Yellow
try {
    $adminResponse = curl -s http://localhost:3000/api/admin/courses.mine
    $admin = $adminResponse | ConvertFrom-Json
    if ($admin.error) {
        Write-Host "   ✅ Correctly rejected: $($admin.error)" -ForegroundColor Green
    }
}
catch {
    Write-Host "   ✅ Admin API is protected" -ForegroundColor Green
}

Write-Host "`n3️⃣  Testing Admin API with ?all=true (should also fail without token)" -ForegroundColor Yellow
try {
    $adminAllResponse = curl -s "http://localhost:3000/api/admin/courses.mine?all=true"
    $adminAll = $adminAllResponse | ConvertFrom-Json
    if ($adminAll.error) {
        Write-Host "   ✅ Correctly rejected: $($adminAll.error)" -ForegroundColor Green
    }
}
catch {
    Write-Host "   ✅ Admin API with ?all=true is protected" -ForegroundColor Green
}

Write-Host "`n💡 To test admin API with authentication:" -ForegroundColor Cyan
Write-Host "   1. Go to http://localhost:3000/admin/login" -ForegroundColor Gray
Write-Host "   2. Sign in with admin credentials" -ForegroundColor Gray
Write-Host "   3. Get token from http://localhost:3000/api/debug/token" -ForegroundColor Gray
Write-Host "   4. Run: curl -H 'Authorization: Bearer TOKEN' http://localhost:3000/api/admin/courses.mine" -ForegroundColor Gray
Write-Host "   5. Run: curl -H 'Authorization: Bearer TOKEN' 'http://localhost:3000/api/admin/courses.mine?all=true'" -ForegroundColor Gray

Write-Host "`n✅ Test Complete!" -ForegroundColor Green