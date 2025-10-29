# Database Schema Reference

## Overview

The Learn AI platform uses **Firebase Firestore**, a NoSQL document database. The schema is designed for a comprehensive learning management system with course enrollment, progress tracking, questionnaire-based assessments, and detailed course browsing functionality.

### Database Architecture

- **Document Store**: NoSQL with flexible schema supporting complex nested data structures
- **Collections**: 9 primary collections plus 3 infrastructure collections (12 total)
- **Subcollections**: Flat structure design for optimal query performance and simpler indexing
- **Ownership Model**: Admin-owned resources with `ownerUid` fields for isolated access control
- **Archiving System**: Soft delete functionality with `archived`, `archivedAt`, `archivedBy` metadata
- **Counter Management**: Denormalized counters for performance (`enrollmentCount`, `completionCount`)
- **Relationships**: Foreign key relationships via document IDs with referential integrity validation
- **Composite Indexes**: 7 composite indexes + automatic single-field indexes for optimal querying
- **Security Model**: Comprehensive Firestore rules with role-based access and ownership enforcement
- **Current Status**: Production-ready with Phase C backend overhaul complete, full API coverage

## Collections

### `users`

**Purpose**: User profiles and authentication data
**Document ID**: Firebase Auth UID
**Security**: Owner read/write access only

```typescript
interface UserDoc {
  uid: string; // Firebase Auth UID (matches doc ID)
  email?: string; // Primary email address
  displayName?: string; // Full name
  photoURL?: string; // Profile picture URL
  role: "user" | "admin"; // Authorization role
  currentStreakDays: number; // Current login streak
  bestStreakDays: number; // All-time best streak
  archived: boolean; // Soft delete flag (default: false)
  archivedAt?: Timestamp; // Archive timestamp
  archivedBy?: string; // Admin who archived
  createdAt: Timestamp; // Account creation
  lastLoginAt: Timestamp; // Most recent login
  updatedAt: Timestamp; // Last profile update
}
```

**Relationships**:

- `enrollments.uid` → `users.uid`
- `progress.uid` → `users.uid`
- `questionnaireResponses.uid` → `users.uid`

### `courses`

**Purpose**: Course templates and metadata
**Document ID**: Auto-generated
**Security**: Public read (published only), admin write only
**Current State**: ✅ Fully implemented and actively used

```typescript
interface CourseDoc {
  ownerUid: string; // Admin who created the course
  title: string; // Course display name
  description: string; // Course overview
  durationMinutes: number; // Estimated completion time
  level: "beginner" | "intermediate" | "advanced";
  published: boolean; // Visibility flag
  archived: boolean; // Soft delete flag (default: false)
  archivedAt?: Timestamp; // Archive timestamp
  archivedBy?: string; // Admin who archived
  heroImageUrl?: string; // Course thumbnail (Firebase Storage URL)
  moduleCount: number; // Denormalized count (auto-updated)
  enrollmentCount: number; // Counter for enrolled users
  completionCount: number; // Counter for completed users
  publishedAt?: Timestamp; // Publication date
  createdAt: Timestamp; // Creation date
  updatedAt: Timestamp; // Last modification
}
```

**Relationships**:

- `courseModules.courseId` → `courses.id`
- `enrollments.courseId` → `courses.id`
- `questionnaireAssignments.scope.courseId` → `courses.id`

**Notes**:

- `moduleCount` is automatically maintained when modules are added/removed
- `published` status cascades to all child modules
- `archived` courses are hidden from public endpoints but preserved for data integrity
- `enrollmentCount` and `completionCount` are atomically updated with idempotency protection
- `heroImageUrl` supports Firebase Storage and external URLs
- Ownership model enforces admin access control for all operations

### `courseModules`

**Purpose**: Individual learning modules within courses
**Document ID**: Auto-generated
**Security**: Public read (published only), admin write only
**Current State**: ✅ Fully implemented with content management

```typescript
interface ModuleDoc {
  ownerUid: string; // Admin who created the module (inherited from course)
  courseId: string; // Parent course reference
  index: number; // Module order (0-based)
  title: string; // Module display name
  summary: string; // Module description
  contentType: "video" | "text" | "pdf" | "image" | "link";
  contentUrl?: string; // External content link or Firebase Storage URL
  body?: string; // Inline text content (for text type)
  estMinutes: number; // Estimated completion time
  published: boolean; // Mirrors course.published (cascaded)
  archived: boolean; // Soft delete flag (default: false)
  archivedAt?: Timestamp; // Archive timestamp
  archivedBy?: string; // Admin who archived
  assets: ModuleAsset[]; // Ordered list of module assets
  createdAt: Timestamp; // Creation date
  updatedAt: Timestamp; // Last modification
}

interface ModuleAsset {
  id: string; // Unique asset identifier
  kind: "pdf" | "video" | "image" | "link";
  url: string; // Asset URL (Firebase Storage or external)
  title?: string; // Optional asset title
  order: number; // Asset order within module (0-based)
  meta?: Record<string, unknown>; // Additional metadata (file size, duration, etc.)
}
```

**Relationships**:

- `courseModules.courseId` → `courses.id`
- `progress.moduleId` → `courseModules.id`
- `questionnaireAssignments.scope.moduleId` → `courseModules.id`

**Constraints**:

- `index` must be unique within each `courseId`
- `published` flag cascades from parent course automatically
- Content URL validation based on `contentType`

**Notes**:

- Supports multiple content types with appropriate validation
- Index-based ordering for consistent module sequencing
- Automatic publication status management

### `enrollments`

**Purpose**: User course registrations and progress summary
**Document ID**: `${uid}_${courseId}`
**Security**: Owner read/write access

```typescript
interface EnrollmentDoc {
  uid: string; // User reference
  courseId: string; // Course reference
  enrolledAt: Timestamp; // Enrollment date
  completed: boolean; // Course completion flag
  completedAt?: Timestamp; // Course completion timestamp
  lastModuleIndex: number; // Resume pointer
  completedCount: number; // Modules completed (denormalized)
  progressPct: number; // Completion percentage (0-100)
  preCourseComplete?: boolean; // Pre-course questionnaire gating
  postCourseComplete?: boolean; // Post-course questionnaire gating
  archived: boolean; // Soft delete flag (default: false)
  archivedAt?: Timestamp; // Archive timestamp
  archivedBy?: string; // Admin who archived
}
```

**Relationships**:

- `enrollments.uid` → `users.uid`
- `enrollments.courseId` → `courses.id`

**Denormalized Fields**:

- `completedCount`: Count of completed modules
- `progressPct`: Calculated from `completedCount / course.moduleCount`

### `progress`

**Purpose**: Individual module completion tracking
**Document ID**: `${uid}_${courseId}_${moduleId}`
**Security**: Owner read/write access

```typescript
interface ProgressDoc {
  uid: string; // User reference
  courseId: string; // Course reference
  moduleId: string; // Module reference
  completed: boolean; // Completion flag
  completedAt?: Timestamp; // Completion date
  preModuleComplete?: boolean; // Pre-module questionnaire gating
  archived: boolean; // Soft delete flag (default: false)
  archivedAt?: Timestamp; // Archive timestamp
  archivedBy?: string; // Admin who archived
}
```

**Relationships**:

- `progress.uid` → `users.uid`
- `progress.courseId` → `courses.id`
- `progress.moduleId` → `courseModules.id`

### `questionnaires`

**Purpose**: Questionnaire templates with versioning
**Document ID**: Auto-generated
**Security**: Admin read/write only (no public access)
**Current State**: ✅ Fully implemented with version control

```typescript
interface QuestionnaireDoc {
  ownerUid: string; // Admin who created the questionnaire
  title: string; // Template name
  purpose: "survey" | "quiz" | "assessment";
  version: number; // Auto-incrementing version (starts at 1)
  questions: QuestionnaireQuestion[];
  archived: boolean; // Soft delete flag (default: false)
  archivedAt?: Timestamp; // Archive timestamp
  archivedBy?: string; // Admin who archived
  createdAt: Timestamp; // Creation date
  updatedAt: Timestamp; // Last modification
}

interface QuestionnaireQuestion {
  id: string; // Unique within questionnaire (auto-generated)
  type: "single" | "multi" | "scale" | "text";
  prompt: string; // Question text
  required: boolean; // Validation flag
  options?: QuestionOption[]; // For single/multi choice (structured format)
  scale?: {
    min: number;
    max: number;
    labels?: Record<number, string>; // Optional scale labels
  };
  correct?: string[]; // Correct option IDs for quiz scoring
  points?: number; // Point value for quiz questions
}

interface QuestionOption {
  id: string; // Stable option identifier
  label: string; // Display text
}
```

**Notes**:

- Version control prevents breaking changes to active assignments
- Structured options format replaced legacy string arrays
- Supports complex quiz scoring with points and correct answers
- Questions support multiple input types with appropriate validation

### `questionnaireAssignments`

**Purpose**: Questionnaire assignments to courses/modules with gating logic
**Document ID**: Auto-generated
**Security**: Admin read/write only (server-side operations)
**Current State**: ✅ Fully implemented with gating system

```typescript
interface QuestionnaireAssignmentDoc {
  ownerUid: string; // Admin who created the assignment
  questionnaireId: string; // Template reference
  questionnaireVersion: number; // Frozen version at assignment time
  scope: {
    type: "course" | "module";
    courseId: string;
    moduleId?: string; // Required if type=module
  };
  timing: "pre" | "post"; // When to present questionnaire
  active: boolean; // Assignment enabled (allows temporary disabling)
  archived: boolean; // Soft delete flag (default: false)
  archivedAt?: Timestamp; // Archive timestamp
  archivedBy?: string; // Admin who archived
  createdAt: Timestamp; // Assignment date
  updatedAt?: Timestamp; // Last modification
}
```

**Relationships**:

- `questionnaireAssignments.questionnaireId` → `questionnaires.id`
- `questionnaireAssignments.scope.courseId` → `courses.id`
- `questionnaireAssignments.scope.moduleId` → `courseModules.id`
- `questionnaireResponses.assignmentId` → `questionnaireAssignments.id`

**Gating Logic**:

- **Pre-course**: Must be completed before course enrollment
- **Post-course**: Must be completed before course marked as finished
- **Pre-module**: Must be completed before module access
- **Post-module**: Must be completed before next module access

**Notes**:

- Version freezing ensures response consistency
- Scope validation enforces proper course/module relationships
- Active flag allows temporary assignment disabling

### `questionnaireResponses`

**Purpose**: User responses to questionnaire assignments with scoring
**Document ID**: `${uid}_${assignmentId}` (prevents duplicate submissions)
**Security**: Owner read/write access only
**Current State**: ✅ Fully implemented with automatic scoring

```typescript
interface QuestionnaireResponseDoc {
  uid: string; // User reference
  assignmentId: string; // Assignment reference
  questionnaireId: string; // Template reference (denormalized)
  questionnaireVersion: number; // Template version (denormalized)
  answers: QuestionnaireAnswer[];
  score?: {
    earned: number; // Points earned
    total: number; // Total possible points
    percentage: number; // Percentage score (0-100)
  };
  archived: boolean; // Soft delete flag (default: false)
  archivedAt?: Timestamp; // Archive timestamp
  archivedBy?: string; // Admin who archived
  submittedAt: Timestamp; // Submission date
  createdAt: Timestamp; // Response creation (for started responses)
}

interface QuestionnaireAnswer {
  questionId: string; // Question reference
  value?: string | number | string[]; // Answer value(s) based on question type
}
```

**Relationships**:

- `questionnaireResponses.uid` → `users.uid`
- `questionnaireResponses.assignmentId` → `questionnaireAssignments.id`

**Answer Format by Question Type**:

- **Single choice**: `value: "option_id"`
- **Multiple choice**: `value: ["option_id1", "option_id2"]`
- **Scale**: `value: 5` (number)
- **Text**: `value: "user input text"`

**Notes**:

- Composite document ID prevents duplicate submissions
- Automatic quiz scoring for questions with correct answers
- Denormalized questionnaire info for response consistency
- Supports partial responses (started but not submitted)

### `loginEvents`

**Purpose**: Authentication audit trail and streak calculation
**Document ID**: Auto-generated
**Security**: Server-only access (no client reads)
**Current State**: ✅ Fully implemented with streak tracking

```typescript
interface LoginEventDoc {
  uid: string; // User reference
  source: "web" | "mobile"; // Login source
  utcDate: string; // UTC date string (YYYY-MM-DD) for streak calculation
  timestamp: Timestamp; // Precise login time
}
```

**Usage**:

- **Streak Calculation**: Daily login tracking for gamification
- **Audit Trail**: Security and analytics logging
- **User Analytics**: Login pattern analysis

**Notes**:

- `utcDate` field enables efficient streak calculation
- Automatic creation on user authentication
- Used for `currentStreakDays` and `bestStreakDays` in user profiles

### `idempotentWrites`

**Purpose**: Request deduplication system for critical operations
**Document ID**: SHA-256 hash of idempotency key
**Security**: Server-only access (no client operations)
**Current State**: ✅ Fully implemented for critical endpoints

```typescript
interface IdempotentWriteDoc {
  key: string; // Original idempotency key (client-provided)
  uid: string; // User who made the request
  endpoint: string; // API endpoint path
  result: Record<string, unknown>; // Cached successful response
  createdAt: Timestamp; // First request timestamp
  expiresAt: Timestamp; // Automatic cleanup time (24 hours)
}
```

**Protected Endpoints**:

- `/api/enroll` - Course enrollment operations
- `/api/progress` - Module completion tracking
- `/api/questionnaires/submit` - Questionnaire response submission

**Idempotency Flow**:

1. Client provides `x-idempotency-key` header
2. Server checks for existing operation with same key
3. Returns cached result if found, otherwise processes request
4. Stores result for future duplicate requests
5. Automatic cleanup after 24-hour TTL

**Benefits**:

- Prevents duplicate enrollments from network retries
- Ensures consistent progress tracking
- Protects against duplicate questionnaire submissions

## Data Relationships

### Foreign Key References

```
users (uid)
├── enrollments (uid → users.uid)
├── progress (uid → users.uid)
└── questionnaireResponses (uid → users.uid)

courses (id)
├── courseModules (courseId → courses.id)
├── enrollments (courseId → courses.id)
├── progress (courseId → courses.id)
└── questionnaireAssignments (scope.courseId → courses.id)

courseModules (id)
├── progress (moduleId → courseModules.id)
└── questionnaireAssignments (scope.moduleId → courseModules.id)

questionnaires (id)
└── questionnaireAssignments (questionnaireId → questionnaires.id)

questionnaireAssignments (id)
└── questionnaireResponses (assignmentId → questionnaireAssignments.id)
```

### Denormalized Fields

**Enrollment Progress** (`enrollments`):

- `completedCount`: Sum of completed modules
- `progressPct`: `(completedCount / course.moduleCount) * 100`

**Course Metadata** (`courses`):

- `moduleCount`: Count of associated `courseModules`

**Response Metadata** (`questionnaireResponses`):

- `questionnaireId`: From assignment reference
- `questionnaireVersion`: From assignment reference

## Required Firestore Indexes

### Composite Indexes

**Status**: ✅ All indexes created and actively used in production

```javascript
// Course modules ordered by index (for course detail API)
{
  collection: "courseModules",
  fields: [
    { field: "courseId", order: "ASC" },
    { field: "index", order: "ASC" }
  ]
}

// User enrollments by date (for enrollment history)
{
  collection: "enrollments",
  fields: [
    { field: "uid", order: "ASC" },
    { field: "enrolledAt", order: "DESC" }
  ]
}

// User progress by course (for progress tracking)
{
  collection: "progress",
  fields: [
    { field: "uid", order: "ASC" },
    { field: "courseId", order: "ASC" }
  ]
}

// Course-level questionnaire assignments (for gating logic)
{
  collection: "questionnaireAssignments",
  fields: [
    { field: "scope.type", order: "ASC" },
    { field: "scope.courseId", order: "ASC" },
    { field: "active", order: "ASC" }
  ]
}

// Module-level questionnaire assignments (for module gating)
{
  collection: "questionnaireAssignments",
  fields: [
    { field: "scope.type", order: "ASC" },
    { field: "scope.courseId", order: "ASC" },
    { field: "scope.moduleId", order: "ASC" },
    { field: "active", order: "ASC" }
  ]
}

// Admin-owned courses (for admin course management)
{
  collection: "courses",
  fields: [
    { field: "ownerUid", order: "ASC" },
    { field: "updatedAt", order: "DESC" }
  ]
}

// Admin-owned modules (for admin module management)
{
  collection: "courseModules",
  fields: [
    { field: "ownerUid", order: "ASC" },
    { field: "courseId", order: "ASC" },
    { field: "index", order: "ASC" }
  ]
}
```

### Single Field Indexes

Auto-created by Firestore:

- `users.uid`
- `enrollments.uid`
- `enrollments.courseId`
- `progress.uid`
- `progress.courseId`
- `progress.moduleId`
- `questionnaireResponses.uid`
- `questionnaireResponses.assignmentId`

## Firestore Security Rules

### Public Collections

- `courses`: Read access for published documents
- `courseModules`: Read access for published documents

### User-Owned Collections

- `users`: Owner read/write access
- `enrollments`: Owner read/write access
- `progress`: Owner read/write access
- `questionnaireResponses`: Owner read/write access

### Server-Only Collections

- `questionnaires`: No client access
- `questionnaireAssignments`: No client access
- `loginEvents`: No client access
- `idempotentWrites`: No client access

### Key Rules

```javascript
// Immutable fields on update
function immut(field) {
  return !(field in resource.data) ||
         request.resource.data[field] == resource.data[field];
}

// Owner validation
function isOwner(uid) {
  return request.auth != null && request.auth.uid == uid;
}

// Enrollment ownership
allow create: if request.resource.data.uid == request.auth.uid;
allow update: if resource.data.uid == request.auth.uid &&
              immut('uid') && immut('courseId');
```

## Transactional Behavior

### Enrollment Process

1. **Gating Check**: Verify pre-course questionnaire requirements
2. **Duplicate Check**: Prevent multiple enrollments
3. **Document Creation**: Create enrollment record
4. **Idempotency**: Store operation result

### Progress Updates

1. **Progress Record**: Create/update module progress
2. **Enrollment Update**: Update completion counts and percentages
3. **Course Completion**: Check if all modules completed
4. **Atomic Update**: Single transaction for consistency

### Questionnaire Submission

1. **Answer Validation**: Verify against frozen template
2. **Score Calculation**: Calculate quiz results
3. **Response Storage**: Store user answers
4. **Gating Update**: Update enrollment/progress flags
5. **Idempotency**: Prevent duplicate submissions

## Consistency Considerations

### Eventually Consistent

- **Module Count**: Updated when modules added/removed
- **Progress Percentage**: Recalculated on module completion
- **Course Completion**: Determined by module count vs. completed count

### Strongly Consistent

- **Enrollment Status**: Immediate consistency required
- **Questionnaire Responses**: Single submission enforcement
- **User Authentication**: Real-time role verification

### Cleanup Operations

- **Idempotency Records**: TTL-based cleanup (24 hours)
- **Login Events**: Manual cleanup via admin scripts
- **Orphaned Documents**: Referential integrity via application logic

## Implementation Status

### ✅ Fully Implemented Collections

All 9 collections are fully implemented and actively used:

- **Core Learning**: `courses`, `courseModules`, `users`, `enrollments`, `progress`
- **Assessment System**: `questionnaires`, `questionnaireAssignments`, `questionnaireResponses`
- **System Operations**: `loginEvents`, `idempotentWrites`

### ✅ Production Ready Features

- Complete CRUD operations for all entities
- Referential integrity enforcement at application level
- Composite indexes for optimal query performance
- Idempotency system for critical operations
- Gating logic for course/module access control
- Automatic streak calculation and progress tracking

### 🚧 Planned Enhancements

- Advanced analytics aggregation collections
- User notification and preference collections
- Course rating and review system
- Content versioning and history tracking

### Database Statistics

- **Primary Collections**: 9 core collections (users, courses, courseModules, enrollments, progress, questionnaires, questionnaireAssignments, questionnaireResponses)
- **Infrastructure Collections**: 3 system collections (loginEvents, idempotentWrites, adminAuditLogs)
- **Composite Indexes**: 7 production-deployed indexes for optimal query performance
- **Security Rules**: Comprehensive ownership model with archiving support - fully deployed
- **API Coverage**: 43 endpoints providing complete CRUD operations with ownership enforcement
- **Archiving System**: Soft delete across all major collections with audit trail
- **Counter Management**: Denormalized performance counters for enrollment and completion tracking
- **Data Integrity**: Transactional updates, idempotency keys, and referential integrity validation
- **Performance**: Optimized for real-time interactions with denormalized data and strategic indexing

## Security Rules

The Firestore security rules implement comprehensive role-based access control with the following key features:

### Admin Ownership Model

- All admin-owned resources (courses, modules, questionnaires) include `ownerUid` field
- Only the owning admin can modify their resources
- Admins cannot modify resources owned by other admins
- Supports multi-admin environments with isolated ownership

### Archiving System

- All collections support soft delete via `archived` boolean field
- Archived documents are hidden from public queries
- Public catalog queries automatically filter: `published == true && archived == false`
- Only admins can archive/unarchive documents
- Archive metadata includes `archivedAt` timestamp and `archivedBy` admin UID

### Key Security Patterns

```javascript
// Public course catalog access (published and non-archived only)
match /courses/{courseId} {
  allow read: if resource.data.published == true &&
                 resource.data.archived == false;
}

// Admin ownership enforcement
match /courses/{courseId} {
  allow write: if request.auth != null &&
                  request.auth.token.role == "admin" &&
                  request.auth.uid == resource.data.ownerUid;
}

// User-specific data isolation
match /enrollments/{enrollmentId} {
  allow read, write: if request.auth != null &&
                        request.auth.uid == resource.data.uid;
}
```

### Collection-Specific Rules

- **courses**: Public read (published+non-archived), admin write (ownership-based)
- **courseModules**: Public read (inherits course visibility), admin write (ownership-based)
- **users**: Self-access only, admin read access
- **enrollments**: User-specific access, admin read access
- **progress**: User-specific access, admin read access
- **questionnaires**: Admin-only access (ownership-based)
- **questionnaireAssignments**: Admin-only access (ownership-based)
- **questionnaireResponses**: User-specific access, admin read access

## Infrastructure Collections

Beyond the core application collections, the system includes several infrastructure collections for system operations:

### `loginEvents`

**Purpose**: Track user login history and streak calculations
**Security**: Server-only access (Admin SDK)
**Schema**:

```typescript
interface LoginEventDoc {
  uid: string; // User reference
  loginAt: Timestamp; // Login timestamp
  provider: string; // Authentication provider
  streakDays: number; // Calculated streak at login
}
```

### `idempotentWrites`

**Purpose**: Prevent duplicate operations via idempotency keys
**Security**: Server-only access (Admin SDK)
**Schema**:

```typescript
interface IdempotentWriteDoc {
  key: string; // Idempotency key (doc ID)
  operation: string; // Operation type
  result: any; // Operation result
  createdAt: Timestamp; // First attempt timestamp
  expiresAt: Timestamp; // Cleanup timestamp
}
```

### `adminAuditLogs`

**Purpose**: Audit trail for admin operations and ownership changes
**Security**: Server-only access (Admin SDK)
**Schema**:

```typescript
interface AdminAuditLogDoc {
  adminUid: string; // Admin performing action
  action: string; // Action type (create, update, archive, etc.)
  resourceType: string; // Resource type (course, module, etc.)
  resourceId: string; // Resource identifier
  changes?: Record<string, any>; // Change details
  timestamp: Timestamp; // Action timestamp
}
```

## Index Requirements

### Composite Indexes

1. **courses**: `(published, archived, createdAt desc)` - Public catalog with archiving
2. **courseModules**: `(courseId, index asc)` - Module ordering
3. **enrollments**: `(uid, enrolledAt desc)` - User enrollment history
4. **progress**: `(uid, courseId, moduleId)` - User progress lookup
5. **questionnaireAssignments**: `(scope.courseId, timing, active)` - Assignment queries
6. **questionnaireResponses**: `(uid, assignmentId)` - User response lookup
7. **users**: `(role, archived, createdAt desc)` - Admin user management

### Performance Optimizations

- Denormalized counters in course documents (`enrollmentCount`, `completionCount`)
- Progress percentage calculated and stored in enrollment documents
- Composite indexes support all query patterns without additional lookups

## Development and Testing

### Local Development

```bash
# Start Firestore emulator (optional)
firebase emulators:start --only firestore

# Initialize database with sample data
npm run seed:dev

# Deploy security rules to emulator
firebase deploy --only firestore:rules --project demo-project
```

### Production Deployment

- All indexes deployed via Firebase CLI
- Security rules deployed and active with archiving support
- Backup and recovery procedures in place
- Monitoring and alerting configured
- Archive cleanup policies for data retention
