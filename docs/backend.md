# Backend API Reference

## Overview

The Learn AI backend is built on **Next.js 16 App Router** with **Firebase** as the primary backend service. It provides a comprehensive learning management system with course enrollment, progress tracking, and questionnaire-based assessments.

### Architecture

- **Runtime**: Next.js 16 API Routes (serverless functions)
- **Database**: Firebase Firestore (NoSQL document store)
- **Authentication**: Firebase Auth with custom role-based access control
- **Admin SDK**: Firebase Admin SDK for server-side operations
- **Validation**: Zod schemas for request/response validation
- **Security**: Bearer token authentication with role-based authorization

### Authentication Flow

- **Users**: Google OAuth authentication → `role: "user"`
- **Admins**: Email/password authentication → `role: "admin"`
- **Session Management**: Firebase ID tokens with custom claims
- **Authorization**: Middleware functions (`requireUser`, `requireAdmin`)

## API Endpoints

### Authentication APIs

#### `POST /api/auth/mark-login`

**Purpose**: Server-side login processing and role assignment
**Auth**: Authenticated user required
**Request**:

```json
Authorization: Bearer <firebase-id-token>
```

**Response**:

```json
{
  "ok": true,
  "uid": "user-uid",
  "role": "user|admin",
  "provider": "google.com|password",
  "currentStreakDays": 5,
  "bestStreakDays": 12
}
```

**Notes**:

- Enforces provider restrictions (users→Google, admins→email/password)
- Updates user document and login events
- Calculates streak data

#### `GET /api/auth/me`

**Purpose**: Get current user profile and session info
**Auth**: Authenticated user required
**Response**:

```json
{
  "uid": "user-uid",
  "email": "user@example.com",
  "role": "user|admin",
  "displayName": "John Doe",
  "currentStreakDays": 5,
  "bestStreakDays": 12
}
```

### Admin APIs

#### `POST /api/admin/course.upsert`

**Purpose**: Create or update course templates
**Auth**: Admin required
**Request**:

```json
{
  "courseId": "optional-for-update",
  "title": "Introduction to Machine Learning",
  "description": "Learn ML fundamentals with hands-on examples",
  "durationMinutes": 240,
  "level": "beginner|intermediate|advanced",
  "heroImageUrl": "https://example.com/image.jpg"
}
```

**Response**:

```json
{
  "courseId": "generated-or-existing-id",
  "created": true,
  "moduleCount": 0
}
```

**Notes**: Auto-generates courseId if not provided, updates `moduleCount` field

#### `POST /api/admin/module.upsert`

**Purpose**: Create or update course modules
**Auth**: Admin required
**Request**:

```json
{
  "moduleId": "optional-for-update",
  "courseId": "course-123",
  "index": 0,
  "title": "Getting Started",
  "summary": "Introduction to the course",
  "contentType": "video|text|pdf|link",
  "contentUrl": "https://example.com/video.mp4",
  "body": "Optional text content",
  "estMinutes": 15
}
```

**Response**:

```json
{
  "moduleId": "generated-or-existing-id",
  "created": true,
  "courseModuleCount": 3
}
```

**Notes**: Updates parent course's `moduleCount`, enforces index uniqueness

#### `POST /api/admin/course.publish`

**Purpose**: Publish/unpublish courses and their modules
**Auth**: Admin required
**Request**:

```json
{
  "courseId": "course-123",
  "published": true
}
```

**Response**:

```json
{
  "courseId": "course-123",
  "published": true,
  "modulesUpdated": 5
}
```

**Notes**: Cascades published status to all course modules

#### `POST /api/admin/questionnaire.upsert`

**Purpose**: Create/update questionnaire templates
**Auth**: Admin required
**Request**:

```json
{
  "questionnaireId": "optional-for-update",
  "title": "Course Feedback Survey",
  "description": "Help us improve the course",
  "purpose": "survey|quiz|mixed",
  "questions": [
    {
      "id": "q1",
      "type": "single|multi|scale|text",
      "prompt": "How would you rate this course?",
      "required": true,
      "options": ["Excellent", "Good", "Fair", "Poor"],
      "correctAnswer": "Excellent"
    }
  ]
}
```

**Response**:

```json
{
  "questionnaireId": "generated-id",
  "version": 1,
  "created": true
}
```

**Notes**: Version control with auto-increment, template validation

#### `POST /api/admin/assignment.upsert`

**Purpose**: Assign questionnaires to courses/modules
**Auth**: Admin required
**Request**:

```json
{
  "assignmentId": "optional-for-update",
  "questionnaireId": "questionnaire-123",
  "scope": {
    "type": "course|module",
    "courseId": "course-123",
    "moduleId": "module-456"
  },
  "timing": "pre|post",
  "active": true
}
```

**Response**:

```json
{
  "assignmentId": "generated-id",
  "questionnaireVersion": 2,
  "created": true
}
```

**Notes**: Freezes questionnaire version, scope validation

#### `POST /api/admin/admins.create`

**Purpose**: Bootstrap admin accounts (development/testing)
**Auth**: Bootstrap key required
**Request**:

```json
{
  "email": "admin@example.com",
  "password": "secure-password",
  "displayName": "Admin User"
}
```

**Response**:

```json
{
  "uid": "admin-uid",
  "email": "admin@example.com",
  "role": "admin"
}
```

**Notes**: Requires `ADMIN_BOOTSTRAP_KEY` environment variable

### User APIs

#### `GET /api/catalog`

**Purpose**: List published courses with enrollment status
**Auth**: Public (no auth required)
**Response**:

```json
{
  "courses": [
    {
      "id": "course-123",
      "title": "Introduction to ML",
      "description": "Learn ML fundamentals",
      "durationMinutes": 240,
      "level": "beginner",
      "moduleCount": 8,
      "heroImageUrl": "https://example.com/image.jpg",
      "enrolled": false,
      "enrollmentId": null
    }
  ]
}
```

**Notes**: Shows enrollment status if user is authenticated

#### `POST /api/enroll`

**Purpose**: Enroll user in a course
**Auth**: User required (Google provider only)
**Idempotency**: Required via `x-idempotency-key` header
**Request**:

```json
{
  "courseId": "course-123"
}
```

**Response**:

```json
{
  "enrollmentId": "user-uid_course-123",
  "enrolled": true,
  "alreadyEnrolled": false
}
```

**Notes**: Checks gating requirements, prevents duplicate enrollments

#### `GET /api/enrollments`

**Purpose**: List user's course enrollments with progress
**Auth**: User required
**Response**:

```json
{
  "enrollments": [
    {
      "id": "user-uid_course-123",
      "courseId": "course-123",
      "courseTitle": "Introduction to ML",
      "enrolled": true,
      "completed": false,
      "lastModuleIndex": 2,
      "completedCount": 3,
      "progressPct": 37,
      "preCourseComplete": true,
      "postCourseComplete": false
    }
  ]
}
```

#### `POST /api/progress`

**Purpose**: Mark module as completed and update progress
**Auth**: User required
**Idempotency**: Required via `x-idempotency-key` header
**Request**:

```json
{
  "courseId": "course-123",
  "moduleId": "module-456",
  "moduleIndex": 2
}
```

**Response**:

```json
{
  "progressId": "user-uid_course-123_module-456",
  "completed": true,
  "enrollmentUpdated": true,
  "courseCompleted": false,
  "newProgressPct": 37
}
```

**Notes**: Transactional update of progress and enrollment records

#### `POST /api/questionnaires/context`

**Purpose**: Get questionnaire assignments for course/module
**Auth**: User required
**Request**:

```json
{
  "courseId": "course-123",
  "moduleId": "optional-module-456"
}
```

**Response**:

```json
{
  "assignments": [
    {
      "id": "assignment-123",
      "questionnaireId": "questionnaire-456",
      "title": "Pre-Course Survey",
      "description": "Initial assessment",
      "timing": "pre",
      "scope": { "type": "course", "courseId": "course-123" },
      "completed": false,
      "submittedAt": null
    }
  ]
}
```

#### `POST /api/questionnaires/start`

**Purpose**: Start questionnaire and get frozen template
**Auth**: User required
**Request**:

```json
{
  "assignmentId": "assignment-123"
}
```

**Response**:

```json
{
  "assignment": {
    "id": "assignment-123",
    "timing": "pre",
    "scope": { "type": "course", "courseId": "course-123" }
  },
  "questionnaire": {
    "id": "questionnaire-456",
    "version": 2,
    "title": "Pre-Course Survey",
    "questions": [
      {
        "id": "q1",
        "type": "single",
        "prompt": "What is your experience level?",
        "required": true,
        "options": ["Beginner", "Intermediate", "Advanced"]
      }
    ]
  }
}
```

**Notes**: Returns frozen questionnaire version, prevents duplicate starts

#### `POST /api/questionnaires/submit`

**Purpose**: Submit questionnaire responses and update gating
**Auth**: User required
**Idempotency**: Required via `x-idempotency-key` header
**Request**:

```json
{
  "assignmentId": "assignment-123",
  "answers": [
    {
      "questionId": "q1",
      "value": "Intermediate"
    },
    {
      "questionId": "q2",
      "values": ["Option A", "Option B"]
    }
  ]
}
```

**Response**:

```json
{
  "responseId": "user-uid_assignment-123",
  "score": 85,
  "totalQuestions": 5,
  "correctAnswers": 4,
  "gatingUpdated": {
    "preCourseComplete": true
  }
}
```

**Notes**: Validates answers, calculates quiz scores, updates gating flags

#### `POST /api/modules/access`

**Purpose**: Check module access and gating requirements
**Auth**: User required
**Request**:

```json
{
  "courseId": "course-123",
  "moduleId": "module-456"
}
```

**Response**:

```json
{
  "hasAccess": false,
  "blockingAssignments": [
    {
      "id": "assignment-123",
      "title": "Pre-Course Survey",
      "timing": "pre",
      "scope": { "type": "course" }
    }
  ]
}
```

### Utility APIs

#### `GET /api/health`

**Purpose**: Service health check
**Auth**: Public
**Response**:

```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "firebase": "connected"
}
```

#### `GET /api/debug/token`

**Purpose**: Debug Firebase token (development only)
**Auth**: User required
**Response**:

```json
{
  "valid": true,
  "uid": "user-uid",
  "email": "user@example.com",
  "role": "user",
  "provider": "google.com",
  "exp": 1640995200
}
```

## Backend Utilities

### Authentication Middleware (`lib/auth.ts`)

- `getUserFromRequest()`: Extract user from Bearer token
- `requireUser()`: Ensure authenticated user (throws 401)
- `requireAdmin()`: Ensure admin role (throws 403)
- `ensureUserDoc()`: Create/update user document
- `updateStreakTransaction()`: Handle login streak calculation

### Validation Schemas (`lib/schemas.ts`)

- Course operations: `zCourseUpsert`, `zPublish`
- Module operations: `zModuleUpsert`
- Enrollment: `zEnroll`, `zProgressComplete`
- Questionnaires: `zQuestionnaireUpsert`, `zAssignmentUpsert`, `zStart`, `zSubmit`

### Firestore Helpers (`lib/firestore.ts`)

- Document ID generators: `enrollmentId()`, `progressId()`, `responseId()`
- Course utilities: `getCourseModuleCount()`, `recomputeCourseModuleCount()`
- Questionnaire utilities: `getAssignmentsForContext()`, `getAssignmentWithTemplate()`
- Gating system: `checkGatingRequirements()`, `updateGatingFlags()`

### Idempotency System

- Header: `x-idempotency-key`
- Storage: `idempotentWrites` collection
- Wrapper: `withIdempotency()` function
- Supported endpoints: `/enroll`, `/progress`, `/questionnaires/submit`

## Testing Strategy

### Development Testing

- **Health Check**: `GET /api/health`
- **Admin Bootstrap**: `POST /api/admin/admins.create`
- **Token Debugging**: `GET /api/debug/token`

### API Testing Tools

- **cURL**: Examples provided in endpoint comments
- **Postman**: Import collection from endpoint documentation
- **Frontend Integration**: React components with `fetch()` calls

### Environment Variables

Required for backend operation:

```bash
# Firebase Configuration
FB_SERVICE_ACCOUNT_KEY_JSON=<firebase-service-account-json>
NEXT_PUBLIC_FIREBASE_CONFIG=<firebase-config-json>

# Admin Bootstrap (optional)
ADMIN_BOOTSTRAP_KEY=<secure-bootstrap-key>
```

## Security Considerations

### Firestore Rules

- **Public**: Published courses/modules (read-only)
- **User-owned**: Enrollments, progress, questionnaire responses
- **Server-only**: Admin collections (questionnaires, assignments)
- **Audit**: Login events, idempotency records

### Authentication

- **JWT Verification**: All requests validated via Firebase Admin SDK
- **Role-based Access**: Custom claims with `user`/`admin` roles
- **Provider Enforcement**: Users must use Google, admins use email/password

### Data Validation

- **Request Validation**: Zod schemas for all inputs
- **Response Sanitization**: Consistent error handling
- **SQL Injection**: N/A (NoSQL document store)
- **XSS**: Client-side responsibility (React)

## Performance Notes

### Database Indexes

See `database.md` for required Firestore composite indexes.

### Caching Strategy

- **Static Content**: Next.js static generation for public pages
- **API Responses**: No server-side caching (real-time data)
- **Client Caching**: React query recommended for frontend

### Concurrency

- **Enrollment**: Idempotent with duplicate checking
- **Progress Updates**: Transactional updates to enrollment/progress
- **Questionnaire Responses**: Single-submission enforcement
