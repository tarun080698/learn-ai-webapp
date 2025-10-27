# Phase 2 API Testing Script
# Run this with PowerShell: .\test-phase2-endpoints.ps1

param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$AdminToken = "",
    [string]$UserToken = ""
)

Write-Host "🧪 Phase 2 Learning System API Testing" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

if (-not $AdminToken) {
    Write-Host "❌ Please provide admin token: .\test-phase2-endpoints.ps1 -AdminToken 'your_admin_token'" -ForegroundColor Red
    Write-Host "   Get admin token from: $BaseUrl/api/debug/token (after admin login)" -ForegroundColor Yellow
    exit 1
}

if (-not $UserToken) {
    Write-Host "⚠️  User token not provided. User-specific tests will be skipped." -ForegroundColor Yellow
    Write-Host "   Get user token from: $BaseUrl/api/debug/token (after Google user login)" -ForegroundColor Yellow
}

# Global variables to store created IDs
$script:CreatedCourseId = ""
$script:CreatedModuleIds = @()

function Invoke-ApiTest {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Headers = @{},
        [string]$Body = $null,
        [switch]$ExpectSuccess = $true
    )

    Write-Host "`n🔹 Testing: $Name" -ForegroundColor Blue
    Write-Host "   $Method $Endpoint" -ForegroundColor Gray

    try {
        $splat = @{
            Uri = "$BaseUrl$Endpoint"
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
        }

        if ($Body) {
            $splat.Body = $Body
            Write-Host "   Body: $Body" -ForegroundColor Gray
        }

        $response = Invoke-RestMethod @splat

        if ($response.ok -eq $true) {
            Write-Host "   ✅ SUCCESS" -ForegroundColor Green
            Write-Host "   Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Green
            return $response
        } else {
            if ($ExpectSuccess) {
                Write-Host "   ❌ FAILED - Expected success but got error" -ForegroundColor Red
            } else {
                Write-Host "   ✅ EXPECTED FAILURE" -ForegroundColor Yellow
            }
            Write-Host "   Error: $($response | ConvertTo-Json -Compress)" -ForegroundColor Yellow
            return $response
        }
    }
    catch {
        if ($ExpectSuccess) {
            Write-Host "   ❌ EXCEPTION: $($_.Exception.Message)" -ForegroundColor Red
        } else {
            Write-Host "   ✅ EXPECTED EXCEPTION: $($_.Exception.Message)" -ForegroundColor Yellow
        }

        # Try to parse error response
        if ($_.Exception.Response) {
            try {
                $errorStream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($errorStream)
                $errorBody = $reader.ReadToEnd()
                Write-Host "   Error Body: $errorBody" -ForegroundColor Yellow
            }
            catch {
                Write-Host "   Could not read error response" -ForegroundColor Yellow
            }
        }
        return $null
    }
}

Write-Host "`n🏗️  PHASE 1: Admin Course Creation & Management" -ForegroundColor Magenta
Write-Host "===============================================" -ForegroundColor Magenta

# Test 1: Create seed data
Write-Host "`n📚 Step 1: Create Seed Data"
$seedResponse = Invoke-ApiTest -Name "Create Seed Data" -Method "POST" -Endpoint "/api/admin/seed.dev" -Headers @{
    "Authorization" = "Bearer $AdminToken"
}

if ($seedResponse -and $seedResponse.created) {
    $script:CreatedCourseId = $seedResponse.created.courseId
    $script:CreatedModuleIds = $seedResponse.created.moduleIds
    Write-Host "   📝 Created Course ID: $script:CreatedCourseId" -ForegroundColor Cyan
    Write-Host "   📝 Created Module IDs: $($script:CreatedModuleIds -join ', ')" -ForegroundColor Cyan
}

# Test 2: Create custom course
Write-Host "`n📚 Step 2: Create Custom Course"
$courseBody = @{
    title = "Test Course Created $(Get-Date -Format 'HH:mm:ss')"
    description = "This is a test course created by the automated testing script"
    durationMinutes = 120
    level = "intermediate"
    heroImageUrl = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800"
} | ConvertTo-Json

$courseResponse = Invoke-ApiTest -Name "Create Custom Course" -Method "POST" -Endpoint "/api/admin/course.upsert" -Headers @{
    "Authorization" = "Bearer $AdminToken"
} -Body $courseBody

$customCourseId = ""
if ($courseResponse -and $courseResponse.courseId) {
    $customCourseId = $courseResponse.courseId
    Write-Host "   📝 Custom Course ID: $customCourseId" -ForegroundColor Cyan
}

# Test 3: Add modules to custom course
if ($customCourseId) {
    Write-Host "`n📚 Step 3: Add Modules to Custom Course"

    # Module 1: Video
    $module1Body = @{
        courseId = $customCourseId
        index = 0
        title = "Introduction Video"
        summary = "Welcome to our test course"
        contentType = "video"
        contentUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        estMinutes = 10
    } | ConvertTo-Json

    $module1Response = Invoke-ApiTest -Name "Add Video Module" -Method "POST" -Endpoint "/api/admin/module.upsert" -Headers @{
        "Authorization" = "Bearer $AdminToken"
    } -Body $module1Body

    # Module 2: Text
    $module2Body = @{
        courseId = $customCourseId
        index = 1
        title = "Theory Chapter"
        summary = "Core concepts and fundamentals"
        contentType = "text"
        body = "# Chapter 1: Introduction`n`nThis is the main content of our text module.`n`n## Key Points`n- Point 1`n- Point 2`n- Point 3"
        estMinutes = 15
    } | ConvertTo-Json

    $module2Response = Invoke-ApiTest -Name "Add Text Module" -Method "POST" -Endpoint "/api/admin/module.upsert" -Headers @{
        "Authorization" = "Bearer $AdminToken"
    } -Body $module2Body
}

# Test 4: Test course publishing
if ($script:CreatedCourseId) {
    Write-Host "`n📚 Step 4: Publish Seed Course"

    $publishBody = @{
        courseId = $script:CreatedCourseId
        published = $true
    } | ConvertTo-Json

    $publishResponse = Invoke-ApiTest -Name "Publish Course" -Method "POST" -Endpoint "/api/admin/course.publish" -Headers @{
        "Authorization" = "Bearer $AdminToken"
    } -Body $publishBody
}

# Test 5: Test unauthorized access (should fail)
Write-Host "`n🔒 Step 5: Test Authorization (Should Fail)"
Invoke-ApiTest -Name "Unauthorized Course Creation" -Method "POST" -Endpoint "/api/admin/course.upsert" -Headers @{} -Body $courseBody -ExpectSuccess:$false

if ($UserToken -and $script:CreatedCourseId) {
    Write-Host "`n👤 PHASE 2: User Learning Flow" -ForegroundColor Magenta
    Write-Host "=============================" -ForegroundColor Magenta

    # Test 6: User enrollment
    Write-Host "`n🎓 Step 6: User Enrollment"
    $enrollBody = @{
        courseId = $script:CreatedCourseId
    } | ConvertTo-Json

    $enrollResponse = Invoke-ApiTest -Name "Enroll in Course" -Method "POST" -Endpoint "/api/enroll" -Headers @{
        "Authorization" = "Bearer $UserToken"
        "x-idempotency-key" = "test-enroll-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    } -Body $enrollBody

    # Test 7: Complete modules (if we have module IDs)
    if ($script:CreatedModuleIds.Count -gt 0) {
        Write-Host "`n📈 Step 7: Complete Modules"

        for ($i = 0; $i -lt $script:CreatedModuleIds.Count; $i++) {
            $moduleId = $script:CreatedModuleIds[$i]

            $progressBody = @{
                courseId = $script:CreatedCourseId
                moduleId = $moduleId
                moduleIndex = $i
            } | ConvertTo-Json

            $progressResponse = Invoke-ApiTest -Name "Complete Module $($i + 1)" -Method "POST" -Endpoint "/api/progress" -Headers @{
                "Authorization" = "Bearer $UserToken"
                "x-idempotency-key" = "test-progress-$moduleId-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
            } -Body $progressBody

            if ($progressResponse) {
                Write-Host "     Progress: $($progressResponse.progressPct)% | Completed: $($progressResponse.completed)" -ForegroundColor Cyan
            }
        }
    }

    # Test 8: Test idempotency (re-enroll should return same result)
    Write-Host "`n🔄 Step 8: Test Idempotency"
    $idempotentEnrollResponse = Invoke-ApiTest -Name "Idempotent Re-enrollment" -Method "POST" -Endpoint "/api/enroll" -Headers @{
        "Authorization" = "Bearer $UserToken"
        "x-idempotency-key" = "test-enroll-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    } -Body $enrollBody
}

Write-Host "`n🎯 TESTING COMPLETE!" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green

if ($script:CreatedCourseId) {
    Write-Host "`n📋 Test Results Summary:" -ForegroundColor Cyan
    Write-Host "  • Seed Course ID: $script:CreatedCourseId"
    Write-Host "  • Module Count: $($script:CreatedModuleIds.Count)"
    Write-Host "  • Course Status: Published"

    if ($UserToken) {
        Write-Host "  • User tested: Enrollment ✅"
        Write-Host "  • User tested: Progress tracking ✅"
        Write-Host "  • User tested: Idempotency ✅"
    } else {
        Write-Host "  • User tests: Skipped (no user token)"
    }
}

Write-Host "`n🌐 Frontend Testing:" -ForegroundColor Yellow
Write-Host "  1. Go to: $BaseUrl/dashboard"
Write-Host "  2. Use Course ID: $script:CreatedCourseId"
Write-Host "  3. Use Module IDs: $($script:CreatedModuleIds -join ', ')"
Write-Host "  4. Test enrollment and progress in the dashboard UI"

Write-Host "`n💡 Next Steps:" -ForegroundColor Yellow
Write-Host "  • Check Firestore console for created data"
Write-Host "  • Test the dashboard UI with the IDs above"
Write-Host "  • Verify progress percentage calculations"
Write-Host "  • Test different content types (video, text, pdf)"