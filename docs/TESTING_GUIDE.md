# 🧪 Phase 2 Complete Testing Guide

## Overview

This guide provides comprehensive testing for all Phase 2 endpoints including both automated scripts and frontend UI testing.

---

## 🚀 Quick Start Testing

### 1. Start Development Server

```bash
npm run dev
```

The server should start at `http://localhost:3000`

### 2. Get Authentication Tokens

#### Get Admin Token:

1. Go to: `http://localhost:3000/admin/login`
2. Sign in with admin email/password
3. Visit: `http://localhost:3000/api/debug/token`
4. Copy the JWT token from the response

#### Get User Token:

1. Go to: `http://localhost:3000/login`
2. Sign in with Google account
3. Visit: `http://localhost:3000/api/debug/token`
4. Copy the JWT token from the response

### 3. Run Automated Testing Script

```powershell
# Basic token helper
.\scripts\get-tokens.ps1

# Full endpoint testing
.\scripts\test-phase2-endpoints.ps1 -AdminToken "your_admin_jwt" -UserToken "your_user_jwt"
```

---

## 🖥️ Frontend UI Testing

### Admin Testing Interface

**URL**: `http://localhost:3000/admin/test`

**Features**:

- ✅ Create seed data (1 course + 3 modules)
- ✅ Create custom courses with validation
- ✅ Add modules with different content types
- ✅ Publish/unpublish courses
- ✅ Real-time response display
- ✅ Auto-fill course IDs between steps

**Test Flow**:

1. **Login as Admin** → Go to admin test page
2. **Create Seed Data** → Get sample course + modules
3. **Publish Course** → Make it available to users
4. **Test Custom Creation** → Create your own course/modules

### User Testing Interface

**URL**: `http://localhost:3000/dashboard`

**Features**:

- ✅ Test course enrollment with idempotency
- ✅ Test module completion with progress tracking
- ✅ Real-time progress percentage updates
- ✅ Visual feedback for all operations
- ✅ Auto-fill course/module IDs

**Test Flow**:

1. **Login as Google User** → Access dashboard
2. **Use Course ID** → From admin testing or seed data
3. **Test Enrollment** → Should return enrollment data
4. **Complete Modules** → Watch progress 0% → 33% → 67% → 100%

---

## 📋 Manual Testing Checklist

### ✅ Admin Endpoints

#### Course Management

- [ ] **POST /api/admin/course.upsert** - Create new course

  - [ ] Required fields: title, description, durationMinutes, level
  - [ ] Optional fields: heroImageUrl
  - [ ] Returns: `{ ok: true, courseId, isUpdate: false }`

- [ ] **POST /api/admin/course.upsert** - Update existing course
  - [ ] Include courseId in payload
  - [ ] Preserves existing moduleCount
  - [ ] Returns: `{ ok: true, courseId, isUpdate: true }`

#### Module Management

- [ ] **POST /api/admin/module.upsert** - Create text module

  - [ ] contentType: "text" requires body field
  - [ ] Auto-updates parent course.moduleCount
  - [ ] Returns: `{ ok: true, moduleId, moduleCount }`

- [ ] **POST /api/admin/module.upsert** - Create media module
  - [ ] contentType: "video|pdf|link" requires contentUrl
  - [ ] Validates parent course exists
  - [ ] Sets published = course.published

#### Publishing Control

- [ ] **POST /api/admin/course.publish** - Publish course

  - [ ] Sets course.published = true
  - [ ] Sets course.publishedAt = now
  - [ ] Updates all modules.published = true
  - [ ] Returns: `{ ok: true, published: true, modulesUpdated: N }`

- [ ] **POST /api/admin/course.publish** - Unpublish course
  - [ ] Sets course.published = false
  - [ ] Removes course.publishedAt field
  - [ ] Updates all modules.published = false

#### Development Helpers

- [ ] **POST /api/admin/seed.dev** - Create test data
  - [ ] Creates 1 course + 3 modules
  - [ ] Different content types (video, text, pdf)
  - [ ] Returns course and module IDs for testing
  - [ ] ⚠️ Should be disabled in production

### ✅ User Endpoints

#### Enrollment Flow

- [ ] **POST /api/enroll** - First enrollment

  - [ ] Requires Google provider (rejects email/password users)
  - [ ] Creates enrollment with defaults: completed=false, progressPct=0
  - [ ] Returns: `{ ok: true, enrollment: {...}, isNew: true }`

- [ ] **POST /api/enroll** - Duplicate enrollment
  - [ ] Idempotent with same course
  - [ ] Returns existing enrollment
  - [ ] Returns: `{ ok: true, enrollment: {...}, isNew: false }`

#### Progress Tracking

- [ ] **POST /api/progress** - Complete module 0

  - [ ] Updates progress.completed = true
  - [ ] Updates enrollment.completedCount = 1
  - [ ] Updates enrollment.progressPct = 33% (1/3)
  - [ ] Updates enrollment.lastModuleIndex = 1

- [ ] **POST /api/progress** - Complete module 1

  - [ ] Updates enrollment.completedCount = 2
  - [ ] Updates enrollment.progressPct = 67% (2/3)
  - [ ] Updates enrollment.lastModuleIndex = 2

- [ ] **POST /api/progress** - Complete module 2
  - [ ] Updates enrollment.completedCount = 3
  - [ ] Updates enrollment.progressPct = 100% (3/3)
  - [ ] Updates enrollment.completed = true
  - [ ] Updates enrollment.lastModuleIndex = 3

#### Idempotency Testing

- [ ] **POST /api/enroll** - With same x-idempotency-key

  - [ ] Returns cached result
  - [ ] No database changes

- [ ] **POST /api/progress** - With same x-idempotency-key
  - [ ] Returns cached result
  - [ ] No double counting of progress

### ✅ Error Handling

#### Authentication Errors

- [ ] **401 Unauthorized** - Missing Authorization header
- [ ] **401 Unauthorized** - Invalid JWT token
- [ ] **403 Forbidden** - Non-admin accessing admin endpoints
- [ ] **403 Forbidden** - Email/password user accessing user endpoints

#### Validation Errors

- [ ] **400 Bad Request** - Invalid zod schema validation
- [ ] **400 Bad Request** - Missing required content (body for text, contentUrl for media)
- [ ] **404 Not Found** - Course/module not found
- [ ] **409 Conflict** - Course not published (enrollment)

#### Response Format

- [ ] Success: `{ ok: true, ...data }`
- [ ] Error: `{ ok: false, code: "error_code", message: "Error message" }`
- [ ] Proper HTTP status codes

---

## 🔍 Database Verification

### Firestore Collections

#### courses Collection

```javascript
// Document structure to verify
{
  title: "Course Title",
  description: "Description",
  durationMinutes: 180,
  level: "beginner",
  published: true,
  moduleCount: 3, // Auto-computed
  createdAt: Timestamp,
  updatedAt: Timestamp,
  publishedAt: Timestamp // Only when published
}
```

#### courseModules Collection

```javascript
// Document structure to verify
{
  courseId: "course-123",
  index: 0, // Sequential per course
  title: "Module Title",
  contentType: "text",
  body: "Content...", // For text
  contentUrl: "https://...", // For media
  published: true, // Mirrors course
  updatedAt: Timestamp
}
```

#### enrollments Collection

```javascript
// Document ID: ${uid}_${courseId}
{
  uid: "user-456",
  courseId: "course-123",
  enrolledAt: Timestamp,
  completed: false,
  lastModuleIndex: 2, // Resume pointer
  completedCount: 1, // Progress tracking
  progressPct: 33 // 0-100 percentage
}
```

#### progress Collection

```javascript
// Document ID: ${uid}_${courseId}_${moduleId}
{
  uid: "user-456",
  courseId: "course-123",
  moduleId: "module-789",
  completed: true,
  completedAt: Timestamp
}
```

### Required Indexes

Check Firestore console for these indexes:

- **courseModules**: `courseId ASC, index ASC`
- **enrollments**: `uid ASC, enrolledAt DESC`

---

## 🚨 Common Issues & Solutions

### Issue: "The query requires an index"

**Solution**: Click the provided link or manually create composite indexes in Firestore console

### Issue: 403 Provider Not Allowed

**Solution**: Ensure Google users are testing user endpoints, not email/password users

### Issue: 404 Course Not Found

**Solution**: Verify course exists and is published before enrollment

### Issue: Module count mismatch

**Solution**: Check that recomputeCourseModuleCount is working after module operations

### Issue: Progress not updating

**Solution**: Verify transaction logic in progress endpoint and check Firestore rules

---

## 📊 Expected Test Results

### Successful Admin Flow:

1. **Seed Data**: Creates course + 3 modules
2. **Custom Course**: Returns courseId
3. **Add Modules**: Updates moduleCount to 2
4. **Publish**: Sets published=true, updates all modules

### Successful User Flow:

1. **Enrollment**: Creates enrollment record
2. **Module 0**: progressPct = 33%, lastModuleIndex = 1
3. **Module 1**: progressPct = 67%, lastModuleIndex = 2
4. **Module 2**: progressPct = 100%, completed = true

### Performance Expectations:

- **Admin operations**: < 500ms per request
- **User operations**: < 300ms per request
- **Transactions**: < 200ms for progress updates
- **Idempotency**: < 100ms for cached responses

---

## 🎯 Next Phase Preparation

After successful Phase 2 testing:

- ✅ All admin CRUD operations working
- ✅ User enrollment and progress tracking functional
- ✅ Denormalization maintaining consistency
- ✅ Provider enforcement active
- ✅ Error handling comprehensive

**Ready for Phase 3**: Questionnaire gating system can now build on this solid foundation!
