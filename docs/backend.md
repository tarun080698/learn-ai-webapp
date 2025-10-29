# Backend API Reference

## Overview

The Learn AI backend is built on **Next.js 16 App Router** with **Firebase** as the primary backend service. It provides a comprehensive learning management system with course enrollment, progress tracking, questionnaire-based assessments, and complete course detail functionality.

### Architecture

- **Runtime**: Next.js 16 API Routes (serverless functions)
- **Database**: Firebase Firestore (NoSQL document store) with composite indexes
- **Authentication**: Firebase Auth with custom role-based access control
- **Admin SDK**: Firebase Admin SDK 13.5 for server-side operations
- **Validation**: Zod 4.1 schemas for request/response validation
- **Security**: Bearer token authentication with role-based authorization
- **File Storage**: Firebase Storage for course images and content
- **Idempotency**: Request deduplication system for critical operations

### Current Implementation Status

**✅ Fully Implemented (25+ endpoints)**:

- Authentication and session management
- Course catalog and detailed course information
- Complete enrollment workflow with gating
- Module completion and progress tracking
- Questionnaire system with assignments and responses
- Admin course, module, and questionnaire management
- User role management and admin operations

**🚧 Partially Implemented**:

- Advanced analytics and reporting
- Bulk operations for course management

**❌ Not Yet Implemented**:

- Course deletion API endpoint
- User promotion to admin workflow
- Advanced content analytics

### Authentication Flow

- **Users**: Google OAuth authentication → `role: "user"`
- **Admins**: Email/password authentication → `role: "admin"`
- **Session Management**: Firebase ID tokens with custom claims
- **Authorization**: Middleware functions (`requireUser`, `requireAdmin`)
- **Streak Tracking**: Automatic calculation of login streaks

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
      "type": "single-choice|multiple-choice|scale|text",
      "prompt": "How would you rate this course?",
      "required": true,
      "options": [
        { "id": "excellent", "label": "Excellent", "correct": true },
        { "id": "good", "label": "Good" },
        { "id": "fair", "label": "Fair" },
        { "id": "poor", "label": "Poor" }
      ]
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

### Public APIs

#### `GET /api/courses/[courseId]`

**Purpose**: Get detailed course information including modules and questionnaires
**Auth**: Public (shows enrollment status if authenticated)
**Response**:

```json
{
  "success": true,
  "course": {
    "id": "course-123",
    "title": "Introduction to Machine Learning",
    "description": "Learn ML fundamentals with hands-on examples",
    "durationMinutes": 240,
    "level": "beginner",
    "heroImageUrl": "https://storage.googleapis.com/...",
    "published": true,
    "moduleCount": 5,
    "modules": [
      {
        "id": "module-456",
        "title": "Getting Started",
        "summary": "Introduction to the course",
        "contentType": "video",
        "contentUrl": "https://example.com/video.mp4",
        "estMinutes": 15,
        "index": 0,
        "published": true
      }
    ],
    "questionnaires": [
      {
        "id": "assignment-789",
        "questionnaireId": "questionnaire-123",
        "timing": "pre",
        "scope": { "type": "course", "courseId": "course-123" }
      }
    ],
    "enrollment": {
      "status": "enrolled|null",
      "enrolledAt": "2025-01-01T00:00:00.000Z|null"
    }
  }
}
```

**Notes**: Returns detailed course information with modules sorted by index, only shows published content

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

#### `GET /api/questionnaires/context`

**Purpose**: Get questionnaire assignments for course/module
**Auth**: User required
**Query Parameters**:

- `courseId` (required): Course identifier
- `moduleId` (optional): Module identifier

**Example**:

```
GET /api/questionnaires/context?courseId=course-123&moduleId=module-456
```

**Response**:

```json
{
  "ok": true,
  "preCourse": {
    "assignmentId": "assignment-123",
    "completed": false
  },
  "postCourse": {
    "assignmentId": "assignment-456",
    "completed": true
  },
  "preModule": {
    "assignmentId": "assignment-789",
    "completed": false
  },
  "postModule": {
    "assignmentId": "assignment-012",
    "completed": false
  }
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
        "type": "single-choice",
        "prompt": "What is your experience level?",
        "required": true,
        "options": [
          { "id": "beginner", "label": "Beginner" },
          { "id": "intermediate", "label": "Intermediate" },
          { "id": "advanced", "label": "Advanced" }
        ]
      }
    ]
  },
  "questionnaireVersion": 2
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
      "value": "intermediate"
    },
    {
      "questionId": "q2",
      "value": ["option_a", "option_b"]
    }
  ]
}
```

**Response**:

```json
{
  "responseId": "user-uid_assignment-123",
  "score": {
    "earned": 4,
    "total": 5
  },
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

## Current Implementation Status

### ✅ Production Ready Endpoints (25+)

**Authentication & User Management**:

- `POST /api/auth/mark-login` - Session management with streak tracking
- `GET /api/auth/me` - User profile and authentication status

**Public Course Discovery**:

- `GET /api/catalog` - Published course listings with enrollment status
- `GET /api/courses/[courseId]` - Detailed course information with modules

**User Learning Workflow**:

- `POST /api/enroll` - Course enrollment with gating and idempotency
- `GET /api/enrollments` - User enrollment history with progress
- `POST /api/progress` - Module completion tracking
- `POST /api/modules/access` - Module access validation

**Assessment System**:

- `GET /api/questionnaires/context` - Assignment context for courses/modules
- `POST /api/questionnaires/start` - Begin questionnaire with frozen template
- `POST /api/questionnaires/submit` - Submit responses with scoring

**Admin Management (14 endpoints)**:

- Complete CRUD for courses, modules, questionnaires, and assignments
- User role management and admin account creation
- File upload and development seeding tools

### 🔧 Recent Bug Fixes & Improvements

**Collection Name Correction**:

- Fixed course detail API to query `courseModules` instead of `modules`
- Aligned public APIs with admin API collection patterns
- Corrected module fetching for course detail pages

**Next.js 16 Compatibility**:

- Updated dynamic route handlers for async params
- Enhanced error handling for authentication flows
- Improved TypeScript types for better development experience

### 📋 Known Limitations

**Missing Endpoints**:

- Course deletion API (UI exists, backend pending)
- User promotion to admin workflow
- Bulk course operations

**Development Areas**:

- Advanced course analytics and reporting
- Content versioning and history
- Enhanced notification system

## Security Considerations

### Firestore Rules ✅ Deployed

- **Public Collections**: `courses`, `courseModules` (published only, read-only)
- **User-Owned Collections**: `users`, `enrollments`, `progress`, `questionnaireResponses`
- **Server-Only Collections**: `questionnaires`, `questionnaireAssignments`, `loginEvents`, `idempotentWrites`
- **Admin Collections**: Full access for admin role, restricted for users

### Authentication & Authorization ✅ Production Ready

- **JWT Verification**: All requests validated via Firebase Admin SDK 13.5
- **Role-Based Access**: Custom claims with strict `user`/`admin` separation
- **Provider Enforcement**: Google OAuth for users, email/password for admins
- **Session Management**: Automatic token refresh and role validation

### Data Validation ✅ Comprehensive

- **Request Validation**: Zod 4.1 schemas for all API inputs with TypeScript integration
- **Response Sanitization**: Consistent error handling with proper HTTP status codes
- **Idempotency Protection**: Duplicate operation prevention for critical endpoints
- **Input Sanitization**: Type-safe validation prevents injection attacks

## Performance & Scalability

### Database Optimization ✅ Implemented

- **Composite Indexes**: 7 strategic indexes for efficient queries (see `database.md`)
- **Denormalized Data**: Strategic duplication for module counts and progress percentages
- **Query Patterns**: Optimized for real-time user interactions and admin operations

### Caching Strategy

- **Static Generation**: Next.js 16 static generation for public course catalog
- **Dynamic Content**: Real-time data for user progress and admin operations
- **Client-Side**: Recommended React Query for frontend state management

### Concurrency & Data Integrity ✅ Robust

- **Idempotency System**: 24-hour TTL for enrollment, progress, and response operations
- **Transactional Updates**: Atomic updates for enrollment and progress changes
- **Gating Logic**: Consistent enforcement of questionnaire requirements
- **Single Submission**: Composite keys prevent duplicate questionnaire responses

### Monitoring & Reliability

- **Health Checks**: `/api/health` endpoint for service monitoring
- **Error Logging**: Comprehensive error tracking with Firebase Admin SDK
- **Development Tools**: Seeding and testing utilities for reliable deployments
