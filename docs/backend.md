# Backend API Reference

## Overview

The Learn AI backend is built on **Next.js 16 App Router** with **Firebase** as the primary backend service. It provides a comprehensive learning management system with course enrollment, progress tracking, questionnaire-based assessments, and complete course detail functionality.

### Architecture

- **Runtime**: Next.js 15+ App Router with serverless API routes (43 endpoints)
- **Database**: Firebase Firestore NoSQL with ownership model and archiving system
- **Authentication**: Firebase Auth with dual provider model (Google OAuth + Email/Password)
- **Authorization**: Role-based access control with admin ownership enforcement
- **Admin SDK**: Firebase Admin SDK for server-side operations and data management
- **Validation**: Zod schema validation for all request/response payloads
- **Security**: Bearer token authentication with comprehensive security rules
- **File Storage**: Firebase Storage with organized asset management system
- **Performance**: Composite indexes and denormalized counters for optimal queries
- **Data Integrity**: Idempotency keys, transactional updates, and audit logging

### Current Implementation Status

**✅ Production Ready (43 API endpoints)**:

- **Authentication & Session Management**: Login processing with streak tracking, user profiles
- **Public Course Discovery**: Course catalog, detailed course information with enrollment status
- **User Learning Workflow**: Course enrollment, progress tracking, module access control
- **Assessment System**: Complete questionnaire workflow with assignments, responses, and scoring
- **Admin Management Suite**: Course/module/questionnaire CRUD operations with ownership model
- **User & Role Management**: Admin user management, role assignments, account administration
- **Asset Management**: File upload system for course heroes and module assets
- **Data Migration**: Database migration tools for schema updates and ownership assignment
- **Health Monitoring**: API health checks and status monitoring

**🏗️ Key Architectural Features**:

- **Ownership Model**: Admin-owned resources with isolated access control
- **Archiving System**: Soft delete functionality across all major collections
- **Counter Management**: Denormalized counters for enrollment and completion tracking
- **Idempotency System**: Request deduplication for critical operations
- **Gating Logic**: Questionnaire-based course/module access control
- **Asset Pipeline**: Multi-format asset support with metadata and ordering

**❌ Future Enhancements**:

- Advanced analytics dashboards
- Bulk operation APIs for mass management
- Content versioning and rollback system
- Advanced reporting and data export

### Authentication Flow

- **Users**: Google OAuth authentication → `role: "user"`
- **Admins**: Email/password authentication → `role: "admin"`
- **Session Management**: Firebase ID tokens with custom claims
- **Authorization**: Middleware functions (`requireUser`, `requireAdmin`)
- **Streak Tracking**: Automatic calculation of login streaks

## API Endpoints (43 Total)

### Authentication & User Management (3 endpoints)

#### `POST /api/auth/mark-login`

**Purpose**: Server-side login processing with streak tracking and role assignment
**Auth**: Authenticated user required
**Features**: Provider validation, streak calculation, user document updates

#### `GET /api/auth/me`

**Purpose**: Get current user profile and session information
**Auth**: Authenticated user required
**Response**: User profile data, role info, streak statistics

#### `POST /api/admin/users/roles` | `GET /api/admin/users/roles`

**Purpose**: Manage user roles and admin assignments
**Auth**: Admin required
**Features**: Role promotion/demotion, user listing with role information

### Public Course Discovery (3 endpoints)

#### `GET /api/catalog`

**Purpose**: Published course catalog for public browsing
**Auth**: Optional (enhanced with enrollment status if authenticated)
**Filtering**: Published courses only, archived courses excluded
**Features**: Enrollment status decoration, course metadata

#### `GET /api/courses/[courseId]`

**Purpose**: Detailed course information with module listing
**Auth**: Optional (enhanced with progress if authenticated)
**Features**: Module structure, questionnaire assignments, progress tracking

#### `GET /api/health`

**Purpose**: API health check and service status monitoring
**Auth**: None required
**Response**: Service status, database connectivity, basic system metrics

### User Learning Workflow (5 endpoints)

#### `POST /api/enroll`

**Purpose**: Course enrollment with gating and idempotency
**Auth**: User required
**Features**: Questionnaire gating, duplicate enrollment prevention, atomic transactions

#### `GET /api/enrollments`

**Purpose**: User's enrollment history with progress and course details
**Auth**: User required (own enrollments only)
**Features**: Progress percentages, course metadata, completion status

#### `POST /api/progress`

**Purpose**: Module completion tracking and progress updates
**Auth**: User required
**Features**: Progress percentage calculation, enrollment updates, gating validation

#### `POST /api/modules/access`

**Purpose**: Module access validation and gating checks
**Auth**: User required
**Features**: Questionnaire completion validation, enrollment verification

#### `GET /api/questionnaires`

**Purpose**: User's questionnaire assignment discovery
**Auth**: User required
**Features**: Assignment context, completion status, response history

### Assessment System (8 endpoints)

#### `GET /api/questionnaires/context`

**Purpose**: Get questionnaire assignments for course/module context
**Auth**: User required
**Features**: Assignment discovery, completion status, gating information

#### `POST /api/questionnaires/start`

**Purpose**: Begin questionnaire with frozen template version
**Auth**: User required
**Features**: Template version locking, response initialization, validation

#### `POST /api/questionnaires/submit`

**Purpose**: Submit questionnaire responses with scoring and gating updates
**Auth**: User required
**Features**: Answer validation, quiz scoring, gating flag updates, idempotency

#### `POST /api/questionnaires/assign`

**Purpose**: Create questionnaire assignments to courses/modules
**Auth**: Admin required
**Features**: Assignment creation, scope validation, timing configuration

#### `POST /api/questionnaires/remove`

**Purpose**: Remove questionnaire assignments
**Auth**: Admin required
**Features**: Assignment cleanup, response handling, validation

#### `GET /api/questionnaires/progress`

**Purpose**: Track questionnaire completion progress
**Auth**: User required
**Features**: Completion tracking, score history, assignment context

#### `POST /api/questionnaires/gate`

**Purpose**: Check questionnaire-based access gates for courses/modules
**Auth**: User required
**Features**: Gating validation, requirement checking, access control

### Admin Course Management (14 endpoints)

#### `POST /api/admin/course.upsert`

**Purpose**: Create or update courses with ownership enforcement
**Auth**: Admin required (course owner only for updates)
**Features**: Course CRUD, ownership validation, metadata management

#### `POST /api/admin/course.publish`

**Purpose**: Publish/unpublish courses with visibility control
**Auth**: Admin required (course owner only)
**Features**: Publication status, visibility control, cascade to modules

#### `POST /api/admin/course.archive`

**Purpose**: Archive/unarchive courses with soft delete
**Auth**: Admin required (course owner only)
**Features**: Soft delete, archive metadata, cascade handling

#### `GET /api/admin/courses.mine`

**Purpose**: Get admin's owned courses with management data
**Auth**: Admin required
**Features**: Ownership filtering, course statistics, management metadata

#### `POST /api/admin/module.upsert`

**Purpose**: Create or update course modules with asset management
**Auth**: Admin required (course owner only)
**Features**: Module CRUD, asset management, ordering, content handling

#### `POST /api/admin/module.archive`

**Purpose**: Archive/unarchive modules with soft delete
**Auth**: Admin required (course owner only)
**Features**: Module soft delete, archive tracking, course consistency

#### `GET /api/admin/modules.mine`

**Purpose**: Get admin's owned modules with course context
**Auth**: Admin required
**Features**: Module listing, course relationship, asset information

#### `POST /api/admin/modules.reorder`

**Purpose**: Reorder modules within courses
**Auth**: Admin required (course owner only)
**Features**: Module reordering, index management, atomic updates

#### `POST /api/admin/asset.add`

**Purpose**: Add assets to modules with metadata
**Auth**: Admin required (module owner only)
**Features**: Asset addition, metadata management, ordering

#### `POST /api/admin/asset.remove`

**Purpose**: Remove assets from modules
**Auth**: Admin required (module owner only)
**Features**: Asset removal, cleanup, order management

#### `POST /api/admin/asset.reorder`

**Purpose**: Reorder assets within modules
**Auth**: Admin required (module owner only)
**Features**: Asset reordering, position management

#### `POST /api/admin/upload`

**Purpose**: Upload files for course heroes and module assets
**Auth**: Admin required
**Features**: File validation, Firebase Storage integration, metadata extraction
**File Size Limits**:

- **Images** (jpg, png, webp): 5MB maximum
- **PDFs**: 10MB maximum
- **Videos** (mp4, webm): 200MB maximum
- **General Assets**: 50MB default maximum

#### `POST /api/admin/seed.dev`

**Purpose**: Development database seeding with sample data
**Auth**: Admin required (development only)
**Features**: Sample data generation, development environment setup

#### `POST /api/dev/migrate`

**Purpose**: Database migration for schema updates and ownership assignment
**Auth**: Admin required (development only)
**Features**: Schema migration, ownership backfill, data transformation

### Admin Questionnaire Management (8 endpoints)

#### `GET /api/admin/questionnaires`

**Purpose**: List all questionnaire templates with admin context
**Auth**: Admin required
**Features**: Template listing, ownership info, version tracking

#### `GET /api/admin/questionnaires.mine`

**Purpose**: Get admin's owned questionnaire templates
**Auth**: Admin required
**Features**: Ownership filtering, template management, usage statistics

#### `POST /api/admin/questionnaire.upsert`

**Purpose**: Create or update questionnaire templates
**Auth**: Admin required (template owner only for updates)
**Features**: Template CRUD, question management, validation

#### `POST /api/admin/questionnaire.create-and-assign`

**Purpose**: Create questionnaire and assign to course/module in one operation
**Auth**: Admin required
**Features**: Atomic creation and assignment, workflow optimization

#### `GET /api/admin/assignments`

**Purpose**: List all questionnaire assignments with context
**Auth**: Admin required
**Features**: Assignment listing, scope information, activity status

#### `GET /api/admin/assignments.mine`

**Purpose**: Get admin's owned questionnaire assignments
**Auth**: Admin required
**Features**: Ownership filtering, assignment management

#### `POST /api/admin/assignment.upsert`

**Purpose**: Create or update questionnaire assignments
**Auth**: Admin required (assignment owner only for updates)
**Features**: Assignment CRUD, scope validation, timing management

#### `POST /api/admin/assignment.update`

**Purpose**: Update existing questionnaire assignment properties
**Auth**: Admin required (assignment owner only)
**Features**: Assignment modification, scope changes, activity toggle

#### `POST /api/admin/assignment.archive`

**Purpose**: Archive questionnaire assignments with soft delete
**Auth**: Admin required (assignment owner only)
**Features**: Assignment archiving, cleanup, audit trail

#### `POST /api/admin/assignment.delete`

**Purpose**: Permanently delete questionnaire assignments
**Auth**: Admin required (assignment owner only)
**Features**: Hard delete, cascade cleanup, validation

#### `POST /api/admin/admins.create`

**Purpose**: Create new admin accounts with proper setup
**Auth**: Admin required
**Features**: Admin account creation, role assignment, validation

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

**Purpose**: Prevents duplicate operations from network retries and ensures consistent behavior.

**Implementation**:

- **Header**: `x-idempotency-key` (required for critical operations)
- **Key Format**: Client-generated UUID v4 recommended (e.g., `uuidv4()`)
- **Storage**: `idempotentWrites` collection with 24-hour TTL
- **Wrapper**: `withIdempotency<T>(db, key, scope, fn)` utility function
- **Scope Tracking**: Operation context for debugging and analytics

**Protected Endpoints**:

- `POST /api/enroll` - Course enrollment operations
- `POST /api/progress` - Module completion tracking
- `POST /api/questionnaires/submit` - Questionnaire response submission

**Flow**:

1. Client sends fresh UUID v4 as `x-idempotency-key` header
2. Server checks `idempotentWrites` collection for existing operation
3. If found, returns cached result without re-execution
4. If not found, executes operation and stores result
5. Automatic cleanup after 24 hours via TTL

**Example Usage**:

```bash
curl -X POST http://localhost:3000/api/enroll \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "x-idempotency-key: $(uuidgen)" \
  -d '{"courseId":"course-123"}'
```

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

**Required for Production**:

```bash
# Firebase Service Account (Required for Admin SDK)
FB_SERVICE_ACCOUNT_KEY_JSON='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'

# Firebase Client Configuration (Required for Authentication)
NEXT_PUBLIC_FIREBASE_CONFIG='{"apiKey":"...","authDomain":"....firebaseapp.com","projectId":"...","storageBucket":"....appspot.com","messagingSenderId":"...","appId":"..."}'
```

**Optional Configuration**:

```bash
# Admin Bootstrap Key (Development/Testing Only)
ADMIN_BOOTSTRAP_KEY=your-secure-bootstrap-key-here

# Environment Detection
NODE_ENV=development|production
NEXT_PUBLIC_ENV=development|production

# Firebase Emulator (Development Only)
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
```

**Security Guidelines**:

- Never commit service account keys to version control
- Use separate Firebase projects for development, staging, and production
- Rotate bootstrap keys regularly in production environments
- Store sensitive environment variables in secure deployment systems

## Current Implementation Status

### ✅ Production Ready Endpoints (43 Total)

**Complete API Coverage**:

- **Authentication & User Management**: 3 endpoints - Login processing, user profiles, role management
- **Public Course Discovery**: 3 endpoints - Course catalog, detailed course info, health monitoring
- **User Learning Workflow**: 5 endpoints - Enrollment, progress tracking, module access, questionnaire discovery
- **Assessment System**: 8 endpoints - Complete questionnaire workflow with assignments and scoring
- **Admin Course Management**: 14 endpoints - Full CRUD for courses, modules, assets with ownership model
- **Admin Questionnaire Management**: 10 endpoints - Template and assignment management with archiving

### 🏗️ Key Architectural Achievements

**Ownership Model Implementation**:

- Admin-owned resources with `ownerUid` field across courses, modules, questionnaires
- Isolated access control preventing cross-admin modifications
- Server-side ownership validation in all admin endpoints

**Archiving System**:

- Soft delete functionality across all major collections
- Archive metadata tracking (`archivedAt`, `archivedBy`)
- Public catalog filtering excludes archived content
- Admin management includes archive/unarchive operations

**Counter Management**:

- Denormalized counters in course documents (`enrollmentCount`, `completionCount`)
- Atomic counter updates via Firebase transactions
- Performance optimization for large-scale operations

**Asset Management Pipeline**:

- Multi-format asset support (PDF, video, image, links)
- Ordered asset arrays with metadata
- File upload system with validation and Firebase Storage integration
- Asset CRUD operations with module ownership enforcement

**Comprehensive Security Model**:

- Role-based access control with Firebase Auth custom claims
- Provider enforcement (Google OAuth for users, email/password for admins)
- Security rules deployed with archiving and ownership filtering
- Request validation with Zod schemas across all endpoints

### 🔧 Recent Major Enhancements

**Phase C Backend Overhaul**:

- Complete ownership model implementation across all admin resources
- Archiving system replacing hard deletes for better data integrity
- Counter management for performance optimization
- Asset management system for rich module content

**Database Migration System**:

- Development migration endpoint for schema updates
- Ownership backfill for existing data
- Archive field initialization across collections

**Enhanced API Endpoints**:

- Asset management (add/remove/reorder) for modules
- Assignment archiving and management workflow
- User role management with admin creation
- Health monitoring and development seeding

### 📋 Future Enhancements

**Advanced Features**:

- Bulk operations API for mass course management
- Advanced analytics and reporting dashboards
- Content versioning and rollback system
- Enhanced notification and communication system

**Performance Optimizations**:

- Query optimization for large datasets
- Caching layer for frequently accessed data
- Background job processing for heavy operations

## Security & Data Architecture

### Firestore Security Rules ✅ Production Deployed

**Public Access Patterns**:

- **courses**: Read access for `published == true && archived != true` only
- **courseModules**: No direct client access (content protection)
- Client access to module content strictly via API endpoints

**User-Owned Collections**:

- **users**: Self-access only, role field immutable from client
- **enrollments**: Owner access with immutable core fields (`uid`, `courseId`)
- **progress**: Owner access with immutable tracking fields
- **questionnaireResponses**: Owner access with response integrity

**Admin-Only Collections** (Server-side only):

- **questionnaires**: No client access, admin API only
- **questionnaireAssignments**: Server-managed with ownership validation
- **loginEvents**, **idempotentWrites**: Infrastructure collections
- **adminAuditLogs**: Admin action logging and audit trail

### Authentication & Authorization Architecture

**Multi-Provider Authentication**:

- **Users**: Google OAuth (`google.com` provider) for simplified onboarding
- **Admins**: Email/password (`password` provider) for account control
- Provider validation enforced at API level with clear error messaging

**Role-Based Access Control**:

- Firebase Auth custom claims with `role: "user" | "admin"`
- Server-side role validation in all protected endpoints
- Admin ownership model prevents cross-admin resource access

**Security Middleware Stack**:

- `getUserFromRequest()`: JWT token validation and user extraction
- `requireUser()` / `requireAdmin()`: Role-based access enforcement
- `assertUserProviderGoogle()`: Provider validation for users
- Request validation with comprehensive Zod schemas

### Data Integrity & Performance

**Ownership Model**:

- All admin-managed resources include `ownerUid` field
- Server-side ownership validation in create/update operations
- Isolated admin environments preventing resource conflicts

**Archiving System**:

- Soft delete with `archived`, `archivedAt`, `archivedBy` metadata
- Public APIs automatically filter archived content
- Admin APIs support archive/unarchive operations with audit trail

**Counter Management**:

- Denormalized counters (`enrollmentCount`, `completionCount`) in course documents
- Atomic updates via Firebase transactions
- Performance optimization for dashboard and analytics queries

**Idempotency System**:

- Critical operations protected with `x-idempotency-key` headers
- Duplicate request detection and prevention
- Consistent behavior for enrollment and questionnaire submissions
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
