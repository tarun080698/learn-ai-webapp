# Database Schema & Architecture

Learn.ai 4all uses **Firebase Firestore**, a comprehensive NoSQL document database designed for a learning management system with course enrollment, progress tracking, questionnaire assessments, and content management capabilities.

## Database Architecture

- **Document Store**: NoSQL with flexible schema supporting complex nested data
- **Collections**: 12 total collections (9 primary + 3 infrastructure)
- **Flat Structure**: Optimized for query performance and simplified indexing
- **Ownership Model**: Admin-owned resources with hierarchical access control
- **Soft Delete System**: Archive functionality with metadata tracking
- **Denormalized Counters**: Performance optimization with cached aggregations
- **Document ID Patterns**: Structured IDs for efficient lookups
- **Composite Indexes**: 8 optimized indexes for query performance
- **Security Rules**: Comprehensive role-based access control
- **Transaction Support**: Atomic operations for data consistency
- **Idempotency Keys**: Duplicate operation prevention system
- **Content Management**: Multi-format content support with validation
- **Audit Trail**: Comprehensive logging system with admin action tracking

## Primary Collections

### 1. `users` - User Profiles & Authentication

**Document ID**: Firebase Auth UID
**Security**: Owner read/write access, immutable role field
**Purpose**: Store user profiles, authentication data, and activity tracking

```typescript
interface UserDoc {
  uid: string; // Firebase Auth UID (matches document ID)
  email?: string; // Primary email address
  displayName?: string; // User's full display name
  photoURL?: string; // Profile picture URL from auth provider
  role: "user" | "admin"; // Authorization role (immutable from client)
  provider: string; // Auth provider (google.com, password, etc.)
  currentStreakDays: number; // Current consecutive login days
  bestStreakDays: number; // All-time best login streak
  archived: boolean; // Soft delete flag (default: false)
  archivedAt?: Timestamp; // When account was archived
  archivedBy?: string; // Admin UID who archived the account
  createdAt: Timestamp; // Account creation timestamp
  lastLoginAt: Timestamp; // Most recent login timestamp
  updatedAt: Timestamp; // Last profile modification
}
```

**Relationships**:

- Referenced by: `enrollments.uid`, `progress.uid`, `questionnaireResponses.uid`
- Indexes: Single-field indexes on `uid`, `email`, `role`

### 2. `courses` - Course Templates & Metadata

**Document ID**: Auto-generated
**Security**: Public read for published courses, admin-only write
**Purpose**: Course definitions with enrollment tracking and publishing control

```typescript
interface CourseDoc {
  ownerUid: string; // Admin who created this course
  title: string; // Course display title
  description: string; // Course description and overview
  level: "beginner" | "intermediate" | "advanced"; // Difficulty level
  durationMinutes: number; // Estimated completion time
  heroImageUrl?: string; // Course hero/banner image URL

  // Publishing and visibility control
  published: boolean; // Public visibility flag (default: false)
  publishedAt?: Timestamp; // When course was first published

  // Denormalized counters for performance
  moduleCount: number; // Number of modules (updated on module changes)
  enrollmentCount: number; // Total user enrollments
  completionCount: number; // Users who completed the course

  // Soft delete functionality
  archived: boolean; // Archive status (default: false)
  archivedAt?: Timestamp; // Archive timestamp
  archivedBy?: string; // Admin UID who archived

  // Timestamps
  createdAt: Timestamp; // Course creation
  updatedAt: Timestamp; // Last modification
}
```

**Relationships**:

- One-to-many: `courseModules.courseId` → `courses.id`
- One-to-many: `enrollments.courseId` → `courses.id`
- Owner relationship: `courses.ownerUid` → `users.uid`

### 3. `courseModules` - Module Content & Assets

**Document ID**: Auto-generated
**Security**: Public read for published modules, admin-only write
**Purpose**: Individual learning modules with content and supplementary assets

```typescript
interface ModuleDoc {
  ownerUid: string; // Admin who owns this module (inherited from course)
  courseId: string; // Parent course reference
  index: number; // 0..N unique per course (for ordering)
  title: string; // Module display title
  summary: string; // Brief description/overview
  contentType: "video" | "text" | "pdf" | "image" | "link"; // Primary content type
  contentUrl?: string; // Optional primary media URL
  body?: string; // Primary text content
  assets: ModuleAsset[]; // Optional secondary media/files
  estMinutes: number; // Estimated completion time
  published: boolean; // Mirrors parent course published status
  archived: boolean; // Soft delete flag
  archivedAt?: Timestamp; // Archive timestamp
  archivedBy?: string; // Admin UID who archived
  createdAt: Timestamp; // Module creation
  updatedAt: Timestamp; // Last modification
}

interface ModuleAsset {
  id: string; // Unique within module
  type: "pdf" | "video" | "image" | "link"; // Asset type
  title: string; // Asset display name
  description?: string; // Optional description
  url: string; // Asset URL (Firebase Storage or external)
  order: number; // Display order within module
  metadata?: Record<string, unknown>; // Additional metadata
}
```

**Relationships**:

- Many-to-one: `courseModules.courseId` → `courses.id`
- One-to-many: `progress.moduleId` → `courseModules.id`
- Owner inheritance: `courseModules.ownerUid` = `courses.ownerUid`

### 4. `enrollments` - Course Enrollment & Progress

**Document ID**: `{uid}_{courseId}` (deterministic)
**Security**: Owner read/write access only
**Purpose**: Track user enrollment in courses with progress metrics

```typescript
interface EnrollmentDoc {
  uid: string; // User ID (Firebase Auth UID)
  courseId: string; // Course reference
  enrolledAt: Timestamp; // Enrollment timestamp
  completed: boolean; // Overall course completion status
  lastModuleIndex: number; // Resume pointer for navigation
  completedCount: number; // Modules completed (denormalized)
  progressPct: number; // 0..100 integer completion percentage
  preCourseComplete?: boolean; // Pre-course questionnaire completion
  postCourseComplete?: boolean; // Post-course questionnaire completion
}
```

**Relationships**:

- Many-to-one: `enrollments.uid` → `users.uid`
- Many-to-one: `enrollments.courseId` → `courses.id`
- One-to-many: `progress.uid` + `progress.courseId` → `enrollments`

### 5. `progress` - Module-Level Progress Tracking

**Document ID**: `{uid}_{courseId}_{moduleId}` (deterministic)
**Security**: Owner read/write access only
**Purpose**: Granular tracking of module completion and gating status

```typescript
interface ProgressDoc {
  uid: string; // User ID
  courseId: string; // Course reference
  moduleId: string; // Module reference
  completed: boolean; // Module completion status
  completedAt?: Timestamp; // Completion timestamp
  preModuleComplete?: boolean; // Pre-module questionnaire gating
  postModuleComplete?: boolean; // Post-module questionnaire gating
}
```

**Relationships**:

- Many-to-one: `progress.uid` → `users.uid`
- Many-to-one: `progress.courseId` → `courses.id`
- Many-to-one: `progress.moduleId` → `courseModules.id`

### 6. `questionnaires` - Assessment Templates

**Document ID**: Auto-generated
**Security**: Server-only access via Admin SDK
**Purpose**: Reusable questionnaire templates with questions and configuration

```typescript
interface QuestionnaireDoc {
  ownerUid: string; // Admin who created this questionnaire
  title: string; // Questionnaire display title
  purpose: "survey" | "quiz" | "assessment"; // Usage type for scoring
  questions: QuestionnaireQuestion[]; // Array of questions

  // Soft delete functionality
  archived: boolean; // Archive status (default: false)
  archivedAt?: Timestamp; // Archive timestamp
  archivedBy?: string; // Admin UID who archived

  // Timestamps
  createdAt: Timestamp; // Template creation
  updatedAt: Timestamp; // Last modification
}

interface QuestionnaireQuestion {
  id: string; // Unique within questionnaire
  type: "single" | "multi" | "scale" | "text"; // Question type
  text: string; // Question text/prompt
  options?: string[]; // For single/multi choice (optional)
  scale?: {
    // For scale questions (optional)
    min: number; // Minimum value
    max: number; // Maximum value
    labels?: { [key: number]: string }; // Label overrides
  };
  required: boolean; // Whether response is required
  order: number; // Display order within questionnaire
}
```

**Relationships**:

- Referenced by: `questionnaireAssignments.questionnaireId`
- Owner relationship: `questionnaires.ownerUid` → `users.uid`

### 7. `questionnaireAssignments` - Assessment Assignments

**Document ID**: Auto-generated
**Security**: Server-only access via Admin SDK
**Purpose**: Assign questionnaires to courses/modules with timing and scope

```typescript
interface QuestionnaireAssignmentDoc {
  questionnaireId: string; // Reference to questionnaire template
  timing: "pre" | "post"; // When to present (before/after content)
  scope: {
    // Where this assignment applies
    type: "course" | "module"; // Assignment scope
    courseId: string; // Always present
    moduleId?: string; // Present for module-scoped assignments
  };
  active: boolean; // Whether assignment is currently active
  createdAt: Timestamp; // Assignment creation
  updatedAt: Timestamp; // Last modification
}
```

**Relationships**:

- Many-to-one: `questionnaireAssignments.questionnaireId` → `questionnaires.id`
- Scope references: `scope.courseId` → `courses.id`, `scope.moduleId` → `courseModules.id`

### 8. `questionnaireResponses` - User Assessment Responses

**Document ID**: `{uid}_{assignmentId}` (deterministic)
**Security**: Owner read/write access only
**Purpose**: Store user responses to assigned questionnaires

```typescript
interface QuestionnaireResponseDoc {
  uid: string; // User who submitted response
  assignmentId: string; // Assignment reference
  questionnaireId: string; // Questionnaire template reference (denormalized)
  responses: Record<string, unknown>; // Question ID → response mapping
  score?: number; // Calculated score (for quizzes/assessments)
  maxScore?: number; // Maximum possible score
  submittedAt: Timestamp; // Submission timestamp
  completedAt?: Timestamp; // Completion confirmation timestamp
}
```

**Relationships**:

- Many-to-one: `questionnaireResponses.uid` → `users.uid`
- Many-to-one: `questionnaireResponses.assignmentId` → `questionnaireAssignments.id`

### 9. `loginEvents` - Session & Streak Tracking

**Document ID**: `{uid}_{dayKey}` (deterministic, one per day)
**Security**: Server-only access via Admin SDK
**Purpose**: Track daily login events for streak calculation

```typescript
interface LoginEventDoc {
  uid: string; // User ID
  dayKey: string; // UTC day key (YYYY-MM-DD format)
  firstLoginAt: Timestamp; // First login of the day
  lastLoginAt: Timestamp; // Most recent login of the day
  loginCount: number; // Number of logins this day
  streakDaysBefore: number; // Streak length before this login
  streakDaysAfter: number; // Streak length after this login
}
```

**Relationships**:

- Many-to-one: `loginEvents.uid` → `users.uid`

## Infrastructure Collections

### 10. `idempotentWrites` - Duplicate Operation Prevention

**Document ID**: Client-provided idempotency key
**Security**: Server-only access
**Purpose**: Prevent duplicate operations for critical workflows

```typescript
interface IdempotentWriteDoc {
  key: string; // Idempotency key
  result: unknown; // Cached operation result
  createdAt: Timestamp; // Creation timestamp
  ttl: Timestamp; // Expiration timestamp (24 hours)
}
```

### 11. `adminAuditLogs` - Administrative Action Tracking

**Document ID**: Auto-generated
**Security**: Server-only access
**Purpose**: Comprehensive audit trail for admin operations

```typescript
interface AdminAuditLogDoc {
  actorUid: string; // Admin performing action
  action: string; // Action type (create, update, archive, etc.)
  target: {
    // Target resource information
    type: "course" | "module" | "questionnaire" | "assignment";
    id: string; // Resource ID
    title?: string; // Resource title for readability
  };
  before?: Record<string, unknown>; // State before change (optional)
  after?: Record<string, unknown>; // State after change (optional)
  timestamp: Timestamp; // Action timestamp
}
```

### 12. `systemMetrics` - Platform Analytics

**Document ID**: Metric-specific keys
**Security**: Server-only access
**Purpose**: Store platform-wide statistics and performance metrics

```typescript
interface SystemMetricsDoc {
  key: string; // Metric identifier
  value: number; // Metric value
  metadata?: Record<string, unknown>; // Additional context
  updatedAt: Timestamp; // Last update timestamp
}
```

## Database Relationships

### Data Flow Diagram

```
users → enrollments → progress → questionnaires
  ↓         ↓           ↓            ↓
courses → modules → assets    assignments → responses
  ↓         ↓
owners   content
```

### Key Relationships

1. **User-Course**: Many-to-many via `enrollments`
2. **Course-Modules**: One-to-many with ordered index
3. **User-Progress**: Many-to-many via `progress` (granular module tracking)
4. **Questionnaires-Assignments**: One-to-many (reusable templates)
5. **Assignments-Responses**: One-to-many (user submissions)
6. **Admin-Resources**: One-to-many ownership model

## Required Firestore Indexes

### Composite Indexes (8 production indexes)

```javascript
// 1. Course modules ordered by index (for course detail API)
{
  collection: "courseModules",
  fields: [
    { field: "courseId", order: "ASC" },
    { field: "index", order: "ASC" }
  ]
}

// 2. User enrollments by date (for enrollment history)
{
  collection: "enrollments",
  fields: [
    { field: "uid", order: "ASC" },
    { field: "enrolledAt", order: "DESC" }
  ]
}

// 3. User progress by course (for progress tracking)
{
  collection: "progress",
  fields: [
    { field: "uid", order: "ASC" },
    { field: "courseId", order: "ASC" }
  ]
}

// 4. Course-level questionnaire assignments (for gating logic)
{
  collection: "questionnaireAssignments",
  fields: [
    { field: "scope.type", order: "ASC" },
    { field: "scope.courseId", order: "ASC" },
    { field: "active", order: "ASC" }
  ]
}

// 5. Module-level questionnaire assignments (for module gating)
{
  collection: "questionnaireAssignments",
  fields: [
    { field: "scope.type", order: "ASC" },
    { field: "scope.courseId", order: "ASC" },
    { field: "scope.moduleId", order: "ASC" },
    { field: "active", order: "ASC" }
  ]
}

// 6. Admin-owned courses (for admin course management)
{
  collection: "courses",
  fields: [
    { field: "ownerUid", order: "ASC" },
    { field: "updatedAt", order: "DESC" }
  ]
}

// 7. Admin-owned modules (for admin module management)
{
  collection: "courseModules",
  fields: [
    { field: "ownerUid", order: "ASC" },
    { field: "courseId", order: "ASC" },
    { field: "index", order: "ASC" }
  ]
}

// 8. Admin-owned questionnaires (for questionnaire management)
{
  collection: "questionnaires",
  fields: [
    { field: "ownerUid", order: "ASC" },
    { field: "updatedAt", order: "DESC" }
  ]
}
```

## Security Rules

### Firestore Security Rules Overview

The security model enforces role-based access control with ownership isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {

    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    function isOwner(uid) {
      return isSignedIn() && request.auth.uid == uid;
    }
    function isAdmin() {
      return isSignedIn() &&
             request.auth.token.role == "admin";
    }
    function immut(field) {
      return !(field in resource.data) ||
             request.resource.data[field] == resource.data[field];
    }

    // PUBLIC READ: Published courses only
    match /courses/{courseId} {
      allow read: if resource.data.published == true &&
                     resource.data.archived != true;
      allow write: if false; // Admin SDK only
    }

    // PUBLIC READ: Published module content
    match /courseModules/{moduleId} {
      allow read: if resource.data.published == true &&
                     resource.data.archived != true;
      allow write: if false; // Admin SDK only
    }

    // USER-OWNED: Profile data with role protection
    match /users/{uid} {
      allow read, write: if isOwner(uid) && immut('role');
    }

    // USER-OWNED: Enrollment records
    match /enrollments/{enrollmentId} {
      allow read, write: if isOwner(resource.data.uid) &&
                           immut('uid') && immut('courseId');
    }

    // USER-OWNED: Progress tracking
    match /progress/{progressId} {
      allow read, write: if isOwner(resource.data.uid) &&
                           immut('uid') && immut('courseId') &&
                           immut('moduleId');
    }

    // USER-OWNED: Questionnaire responses
    match /questionnaireResponses/{responseId} {
      allow read, write: if isOwner(resource.data.uid) &&
                           immut('uid') && immut('assignmentId');
    }

    // SERVER-ONLY: All other collections
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Key Security Features

1. **Admin Ownership Model**: Resources owned by creating admin
2. **User Data Isolation**: Users can only access their own data
3. **Immutable Fields**: Critical fields cannot be modified after creation
4. **Published Content**: Only published courses/modules are publicly readable
5. **Archive Filtering**: Archived content is excluded from public access
6. **Server-Side Enforcement**: Admin operations restricted to server SDK

## Data Patterns & Best Practices

### Document ID Patterns

- **Deterministic IDs**: For relationships and deduplication
  - `enrollments`: `{uid}_{courseId}`
  - `progress`: `{uid}_{courseId}_{moduleId}`
  - `responses`: `{uid}_{assignmentId}`
  - `loginEvents`: `{uid}_{dayKey}`

### Denormalization Strategy

- **Course Counters**: `moduleCount`, `enrollmentCount`, `completionCount`
- **Progress Aggregation**: `completedCount`, `progressPct` in enrollments
- **Template References**: `questionnaireId` copied to responses

### Soft Delete Implementation

- **Archive Fields**: `archived`, `archivedAt`, `archivedBy`
- **Query Filtering**: Exclude archived items in public queries
- **Admin Management**: Archive/unarchive operations with audit trail

### Counter Management

```typescript
// Atomic counter updates
export async function updateEnrollmentCounter(
  db: FirebaseFirestore.Firestore,
  courseId: string,
  increment: boolean
): Promise<void> {
  const courseRef = db.collection("courses").doc(courseId);
  await db.runTransaction(async (transaction) => {
    const course = await transaction.get(courseRef);
    const currentCount = course.data()?.enrollmentCount || 0;
    const newCount = increment
      ? currentCount + 1
      : Math.max(0, currentCount - 1);
    transaction.update(courseRef, {
      enrollmentCount: newCount,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}
```

## Migration & Maintenance

### Schema Versioning

- **Backward Compatibility**: New fields are optional
- **Migration Scripts**: Available in `/api/dev/migrate`
- **Gradual Rollout**: Phased deployment of schema changes

### Data Cleanup

- **Idempotency TTL**: 24-hour automatic cleanup
- **Archive Management**: Soft delete with restoration capability
- **Orphaned Data**: Cleanup scripts for referential integrity

### Performance Monitoring

- **Index Usage**: Monitor query performance and index utilization
- **Document Size**: Track document growth and optimize structure
- **Query Patterns**: Analyze and optimize frequent queries

This database architecture provides a robust, scalable, and secure foundation for the Learn.ai 4all learning management system, with comprehensive data modeling and production-ready performance optimizations.
