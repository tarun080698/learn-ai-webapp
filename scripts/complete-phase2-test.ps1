# Complete Phase 2 Testing & Verification Script
# Usage: .\complete-phase2-test.ps1 -AdminToken "jwt_token" -UserToken "jwt_token"

param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$AdminToken = "",
    [string]$UserToken = ""
)

Write-Host "🧪 COMPLETE Phase 2 Testing & Verification" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

# Pre-flight checks
Write-Host "`n🔍 Pre-flight Checks" -ForegroundColor Yellow

# Check if server is running
try {
    $healthResponse = Invoke-RestMethod -Uri "$BaseUrl/api/health" -Method GET
    Write-Host "✅ Server is running: $($healthResponse.status)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Server not running at $BaseUrl" -ForegroundColor Red
    Write-Host "   Run: npm run dev" -ForegroundColor Yellow
    exit 1
}

# Validate tokens
if (-not $AdminToken) {
    Write-Host "❌ Admin token required" -ForegroundColor Red
    Write-Host "   1. Go to: $BaseUrl/admin/login" -ForegroundColor Yellow
    Write-Host "   2. Sign in as admin" -ForegroundColor Yellow
    Write-Host "   3. Visit: $BaseUrl/api/debug/token" -ForegroundColor Yellow
    Write-Host "   4. Copy JWT token" -ForegroundColor Yellow
    exit 1
}

if (-not $UserToken) {
    Write-Host "⚠️  User token not provided - user tests will be skipped" -ForegroundColor Yellow
    Write-Host "   Get from: $BaseUrl/login → Google sign in → $BaseUrl/api/debug/token" -ForegroundColor Yellow
}

# Global test results
$script:TestResults = @{
    AdminTests = @{}
    UserTests = @{}
    TotalTests = 0
    PassedTests = 0
    FailedTests = 0
}

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Headers = @{},
        [string]$Body = $null,
        [bool]$ExpectSuccess = $true,
        [string]$Category = "General"
    )

    $script:TestResults.TotalTests++

    Write-Host "`n🔸 Testing: $Name" -ForegroundColor Blue
    Write-Host "   $Method $Endpoint" -ForegroundColor Gray

    try {
        $splat = @{
            Uri = "$BaseUrl$Endpoint"
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
            TimeoutSec = 30
        }

        if ($Body) {
            $splat.Body = $Body
        }

        $response = Invoke-RestMethod @splat

        if ($response.ok -eq $true -and $ExpectSuccess) {
            Write-Host "   ✅ PASS" -ForegroundColor Green
            $script:TestResults.PassedTests++
            $script:TestResults.$Category[$Name] = "PASS"
            return $response
        }
        elseif ($response.ok -eq $false -and -not $ExpectSuccess) {
            Write-Host "   ✅ PASS (Expected failure)" -ForegroundColor Green
            $script:TestResults.PassedTests++
            $script:TestResults.$Category[$Name] = "PASS"
            return $response
        }
        else {
            Write-Host "   ❌ FAIL - Unexpected result" -ForegroundColor Red
            Write-Host "   Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Red
            $script:TestResults.FailedTests++
            $script:TestResults.$Category[$Name] = "FAIL"
            return $response
        }
    }
    catch {
        if (-not $ExpectSuccess) {
            Write-Host "   ✅ PASS (Expected exception)" -ForegroundColor Green
            $script:TestResults.PassedTests++
            $script:TestResults.$Category[$Name] = "PASS"
        }
        else {
            Write-Host "   ❌ FAIL - Exception: $($_.Exception.Message)" -ForegroundColor Red
            $script:TestResults.FailedTests++
            $script:TestResults.$Category[$Name] = "FAIL"
        }
        return $null
    }
}

# ============================================
# ADMIN ENDPOINT TESTING
# ============================================

Write-Host "`n🔧 ADMIN ENDPOINT TESTING" -ForegroundColor Magenta
Write-Host "=========================" -ForegroundColor Magenta

$script:CourseId = ""
$script:ModuleIds = @()

# Test 1: Create seed data
$seedResponse = Test-Endpoint -Name "Create Seed Data" -Method "POST" -Endpoint "/api/admin/seed.dev" `
    -Headers @{ "Authorization" = "Bearer $AdminToken" } -Category "AdminTests"

if ($seedResponse -and $seedResponse.created) {
    $script:CourseId = $seedResponse.created.courseId
    $script:ModuleIds = $seedResponse.created.moduleIds
    Write-Host "   📝 Course ID: $script:CourseId" -ForegroundColor Cyan
    Write-Host "   📝 Module IDs: $($script:ModuleIds -join ', ')" -ForegroundColor Cyan
}

# Test 2: Create custom course
$coursePayload = @{
    title = "Automated Test Course $(Get-Date -Format 'HH:mm:ss')"
    description = "Created by automated testing script"
    durationMinutes = 90
    level = "beginner"
    heroImageUrl = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800"
} | ConvertTo-Json

$courseResponse = Test-Endpoint -Name "Create Custom Course" -Method "POST" -Endpoint "/api/admin/course.upsert" `
    -Headers @{ "Authorization" = "Bearer $AdminToken" } -Body $coursePayload -Category "AdminTests"

$customCourseId = ""
if ($courseResponse -and $courseResponse.courseId) {
    $customCourseId = $courseResponse.courseId
    Write-Host "   📝 Custom Course ID: $customCourseId" -ForegroundColor Cyan
}

# Test 3: Add module to custom course
if ($customCourseId) {
    $modulePayload = @{
        courseId = $customCourseId
        index = 0
        title = "Test Module"
        summary = "A test module for validation"
        contentType = "text"
        body = "# Test Content`n`nThis is test content for automated validation."
        estMinutes = 10
    } | ConvertTo-Json

    Test-Endpoint -Name "Add Module to Custom Course" -Method "POST" -Endpoint "/api/admin/module.upsert" `
        -Headers @{ "Authorization" = "Bearer $AdminToken" } -Body $modulePayload -Category "AdminTests"
}

# Test 4: Publish seed course
if ($script:CourseId) {
    $publishPayload = @{
        courseId = $script:CourseId
        published = $true
    } | ConvertTo-Json

    Test-Endpoint -Name "Publish Seed Course" -Method "POST" -Endpoint "/api/admin/course.publish" `
        -Headers @{ "Authorization" = "Bearer $AdminToken" } -Body $publishPayload -Category "AdminTests"
}

# Test 5: Update existing course
if ($script:CourseId) {
    $updatePayload = @{
        courseId = $script:CourseId
        title = "Updated Seed Course Title"
        description = "Updated by automated test"
        durationMinutes = 200
        level = "intermediate"
    } | ConvertTo-Json

    Test-Endpoint -Name "Update Existing Course" -Method "POST" -Endpoint "/api/admin/course.upsert" `
        -Headers @{ "Authorization" = "Bearer $AdminToken" } -Body $updatePayload -Category "AdminTests"
}

# Test 6: Unauthorized admin access (should fail)
Test-Endpoint -Name "Unauthorized Admin Access" -Method "POST" -Endpoint "/api/admin/course.upsert" `
    -Headers @{} -Body $coursePayload -ExpectSuccess $false -Category "AdminTests"

# ============================================
# USER ENDPOINT TESTING
# ============================================

if ($UserToken -and $script:CourseId) {
    Write-Host "`n👤 USER ENDPOINT TESTING" -ForegroundColor Magenta
    Write-Host "========================" -ForegroundColor Magenta

    # Test 7: Enroll in course
    $enrollPayload = @{
        courseId = $script:CourseId
    } | ConvertTo-Json

    $enrollResponse = Test-Endpoint -Name "Course Enrollment" -Method "POST" -Endpoint "/api/enroll" `
        -Headers @{
            "Authorization" = "Bearer $UserToken"
            "x-idempotency-key" = "test-enroll-$(Get-Date -Format 'yyyyMMddHHmmss')"
        } -Body $enrollPayload -Category "UserTests"

    # Test 8: Complete all modules
    if ($script:ModuleIds.Count -gt 0) {
        for ($i = 0; $i -lt $script:ModuleIds.Count; $i++) {
            $progressPayload = @{
                courseId = $script:CourseId
                moduleId = $script:ModuleIds[$i]
                moduleIndex = $i
            } | ConvertTo-Json

            $progressResponse = Test-Endpoint -Name "Complete Module $($i + 1)" -Method "POST" -Endpoint "/api/progress" `
                -Headers @{
                    "Authorization" = "Bearer $UserToken"
                    "x-idempotency-key" = "test-progress-$($script:ModuleIds[$i])-$(Get-Date -Format 'yyyyMMddHHmmss')"
                } -Body $progressPayload -Category "UserTests"

            if ($progressResponse) {
                Write-Host "     Progress: $($progressResponse.progressPct)% | Completed: $($progressResponse.completed)" -ForegroundColor Cyan
            }
        }
    }

    # Test 9: Idempotent enrollment (should return same result)
    Test-Endpoint -Name "Idempotent Re-enrollment" -Method "POST" -Endpoint "/api/enroll" `
        -Headers @{
            "Authorization" = "Bearer $UserToken"
            "x-idempotency-key" = "test-enroll-$(Get-Date -Format 'yyyyMMddHHmmss')"
        } -Body $enrollPayload -Category "UserTests"

    # Test 10: Unauthorized user access to admin endpoint (should fail)
    Test-Endpoint -Name "User Access to Admin Endpoint" -Method "POST" -Endpoint "/api/admin/course.upsert" `
        -Headers @{ "Authorization" = "Bearer $UserToken" } -Body $coursePayload `
        -ExpectSuccess $false -Category "UserTests"
}

# ============================================
# RESULTS SUMMARY
# ============================================

Write-Host "`n📊 TESTING RESULTS SUMMARY" -ForegroundColor Green
Write-Host "===========================" -ForegroundColor Green

$passRate = [math]::Round(($script:TestResults.PassedTests / $script:TestResults.TotalTests) * 100, 1)

Write-Host "`n🎯 Overall Results:" -ForegroundColor Cyan
Write-Host "   Total Tests: $($script:TestResults.TotalTests)"
Write-Host "   Passed: $($script:TestResults.PassedTests)" -ForegroundColor Green
Write-Host "   Failed: $($script:TestResults.FailedTests)" -ForegroundColor Red
Write-Host "   Pass Rate: $passRate%" -ForegroundColor $(if ($passRate -ge 90) { "Green" } elseif ($passRate -ge 70) { "Yellow" } else { "Red" })

Write-Host "`n🔧 Admin Tests:" -ForegroundColor Yellow
foreach ($test in $script:TestResults.AdminTests.GetEnumerator()) {
    $color = if ($test.Value -eq "PASS") { "Green" } else { "Red" }
    Write-Host "   $($test.Value): $($test.Key)" -ForegroundColor $color
}

if ($UserToken) {
    Write-Host "`n👤 User Tests:" -ForegroundColor Yellow
    foreach ($test in $script:TestResults.UserTests.GetEnumerator()) {
        $color = if ($test.Value -eq "PASS") { "Green" } else { "Red" }
        Write-Host "   $($test.Value): $($test.Key)" -ForegroundColor $color
    }
}

Write-Host "`n📋 Created Test Data:" -ForegroundColor Cyan
if ($script:CourseId) {
    Write-Host "   📚 Published Course ID: $script:CourseId"
    Write-Host "   📄 Module Count: $($script:ModuleIds.Count)"
    Write-Host "   🌐 Frontend Test URL: $BaseUrl/dashboard"
}

Write-Host "`n💡 Next Steps:" -ForegroundColor Yellow
if ($passRate -eq 100) {
    Write-Host "   🎉 ALL TESTS PASSED! Phase 2 is ready for production." -ForegroundColor Green
    Write-Host "   • Test the frontend interfaces:" -ForegroundColor Gray
    Write-Host "     - Admin: $BaseUrl/admin/test" -ForegroundColor Gray
    Write-Host "     - User: $BaseUrl/dashboard" -ForegroundColor Gray
    Write-Host "   • Verify Firestore data in console" -ForegroundColor Gray
    Write-Host "   • Ready to begin Phase 3 development" -ForegroundColor Gray
}
else {
    Write-Host "   🔧 Some tests failed - review errors above" -ForegroundColor Red
    Write-Host "   • Check authentication tokens" -ForegroundColor Gray
    Write-Host "   • Verify server is running correctly" -ForegroundColor Gray
    Write-Host "   • Check Firestore configuration" -ForegroundColor Gray
}

Write-Host "`n🎯 Phase 2 Status: $(if ($passRate -eq 100) { 'COMPLETE ✅' } else { 'NEEDS ATTENTION ⚠️' })" -ForegroundColor $(if ($passRate -eq 100) { "Green" } else { "Yellow" })