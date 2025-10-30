# Database Schema Reference

## Overview

The Learn AI platform uses **Firebase Firestore**, a comprehensive NoSQL document database designed for a learning management system with course enrollment, progress tracking, questionnaire assessments, and content management capabilities.

### Database Architecture

- **Document Store**: NoSQL with flexible schema supporting complex nested data structures
- **Collections**: 12 total collections (9 primary + 3 infrastructure)
- **Flat Structure**: Optimized for query performance and simplified indexing
- **Ownership Model**: Admin-owned resources with hierarchical access control and inheritance
- **Soft Delete System**: Archive functionality with `archived`, `archivedAt`, `archivedBy` fields
- **Denormalized Counters**: Performance optimization with cached aggregations and real-time updates
- **Document ID Patterns**: Structured IDs for efficient lookups and deterministic relationships
- **Composite Indexes**: 8 optimized indexes for query performance and sorting
- **Security Rules**: Comprehensive Firestore rules with role-based access control
- **Transaction Support**: Atomic operations for data consistency and integrity
- **Idempotency Keys**: Duplicate operation prevention system with cleanup mechanisms
- **Content Management**: Multi-format content support with validation and metadata
- **Audit Trail**: Comprehensive logging system with admin action tracking

## Primary Collections

### 1. `users` - User Profiles and Authentication

**Purpose**: Store user profiles, authentication data, and activity tracking
**Document ID**: Firebase Auth UID
**Security**: Owner read/write access, immutable role field
**Key Features**: Login streak tracking, role-based access control

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

### 2. `courses` - Course Templates and Metadata

**Purpose**: Course definitions with enrollment tracking and publishing control
**Document ID**: Auto-generated
**Security**: Public read for published courses, admin-only write via server
**Key Features**: Denormalized counters, publishing workflow, ownership model

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

### 3. `courseModules` - Module Content and Assets

**Purpose**: Individual learning modules with content and supplementary assets
**Document ID**: Auto-generated
**Security**: Server-only access, content delivery via API
**Key Features**: Ordered content, multi-format support, asset management

```typescript
interface ModuleDoc {
  ownerUid: string; // Inherited from parent course
  courseId: string; // Parent course reference
  index: number; // Order within course (0-based, unique per course)
  title: string; // Module display title
  summary: string; // Brief description for listing and course wizard

  // Content definition (enhanced validation)
  contentType: "video" | "text" | "pdf" | "image" | "link"; // Primary content type
  contentUrl?: string; // URL for video/pdf/image/link content (required for non-text)
  body?: string; // Rich text/markdown content for text modules (required for text)
  estMinutes: number; // Estimated completion time (minimum 1 minute)

  // Supplementary assets with reordering support
  assets: ModuleAsset[]; // Array of additional resources with order management

  // Publishing control (cascade from parent)
  published: boolean; // Visibility flag (inherited from course)

  // Soft delete functionality
  archived: boolean; // Archive status (default: false)
  archivedAt?: Timestamp; // Archive timestamp
  archivedBy?: string; // Admin UID who archived

  // Timestamps
  createdAt: Timestamp; // Module creation
  updatedAt: Timestamp; // Last modification
}

interface ModuleAsset {
  id: string; // Unique within module
  kind: "pdf" | "video" | "image" | "link"; // Asset type
  url: string; // Resource URL (Firebase Storage or external)
  title?: string; // Display name
  order: number; // Display order within module (supports drag-and-drop)
  meta?: Record<string, any>; // Additional metadata (file size, duration, dimensions)
}
```

**Relationships**:

- Parent: `courseModules.courseId` → `courses.id`
- Referenced by: `progress.moduleId` → `courseModules.id`
- Composite index: `(courseId, index)` for ordered retrieval

### 4. `enrollments` - User Course Enrollments

**Purpose**: Track user course enrollments with progress and completion status
**Document ID**: `${uid}_${courseId}` (deterministic)
**Security**: User can read/write own enrollments only
**Key Features**: Progress tracking, resume pointers, completion detection

```typescript
interface EnrollmentDoc {
  uid: string; // User reference (part of document ID)
  courseId: string; // Course reference (part of document ID)
  enrolledAt: Timestamp; // Enrollment timestamp

  // Progress tracking (denormalized for performance)
  completed: boolean; // Course completion status
  lastModuleIndex: number; // Resume pointer (next module to complete)
  completedCount: number; // Number of completed modules
  progressPct: number; // Progress percentage (0-100)

  // Questionnaire gating flags
  preCourseComplete?: boolean; // Pre-course questionnaire completed
  postCourseComplete?: boolean; // Post-course questionnaire completed
}
```

**Relationships**:

- References: `enrollments.uid` → `users.uid`, `enrollments.courseId` → `courses.id`
- One-to-many: `progress` documents for individual module completions
- Composite index: `(uid, enrolledAt DESC)` for user dashboard

### 5. `progress` - Individual Module Completion Records

**Purpose**: Track completion of individual modules within courses
**Document ID**: `${uid}_${courseId}_${moduleId}` (deterministic)
**Security**: User can read/write own progress only
**Key Features**: Module-level tracking, questionnaire gating, timestamps

```typescript
interface ProgressDoc {
  uid: string; // User reference
  courseId: string; // Course reference
  moduleId: string; // Module reference
  completed: boolean; // Completion status
  completedAt?: Timestamp; // Completion timestamp

  // Module-level questionnaire gating
  preModuleComplete?: boolean; // Pre-module questionnaire completed
  postModuleComplete?: boolean; // Post-module questionnaire completed
}
```

**Relationships**:

- References: `progress.uid` → `users.uid`, `progress.courseId` → `courses.id`, `progress.moduleId` → `courseModules.id`
- Aggregated to: `enrollments` for course-level progress tracking

### 6. `questionnaires` - Questionnaire Templates

**Purpose**: Reusable questionnaire templates with questions and configuration
**Document ID**: Auto-generated
**Security**: Server-only access via Admin SDK
**Key Features**: Version control, question validation, multi-purpose support

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
  prompt: string; // Question text/prompt
  required: boolean; // Validation requirement

  // Choice-based questions (single/multi)
  options?: { id: string; label: string }[]; // Answer choices

  // Scale questions
  scale?: {
    min: number; // Minimum scale value
    max: number; // Maximum scale value
    labels?: Record<number, string>; // Optional scale labels
  };

  // Quiz/assessment scoring
  correct?: string[]; // Correct option IDs for scoring
  points?: number; // Point value (default: 1)
}
```

**Relationships**:

- Owner: `questionnaires.ownerUid` → `users.uid`
- Referenced by: `questionnaireAssignments.questionnaireId` → `questionnaires.id`

### 7. `questionnaireAssignments` - Assignment of Questionnaires to Courses/Modules

**Purpose**: Assign questionnaire templates to specific course or module contexts
**Document ID**: Auto-generated
**Security**: Server-only access via Admin SDK
**Key Features**: Scope-based assignment, timing control, activation toggle

```typescript
interface QuestionnaireAssignmentDoc {
  ownerUid: string; // Admin who created the assignment
  questionnaireId: string; // Template reference

  // Assignment scope and context
  scope: {
    type: "course" | "module"; // Assignment level
    courseId: string; // Course context
    moduleId?: string; // Module context (required if type=module)
  };

  timing: "pre" | "post"; // When to present questionnaire
  active: boolean; // Assignment enabled flag (allows temporary disabling)

  // Soft delete functionality
  archived: boolean; // Archive status (default: false)
  archivedAt?: Timestamp; // Archive timestamp
  archivedBy?: string; // Admin UID who archived

  // Timestamps
  createdAt: Timestamp; // Assignment creation
  updatedAt: Timestamp; // Last modification
}
```

**Relationships**:

- References: `questionnaireAssignments.questionnaireId` → `questionnaires.id`
- Composite index: `(scope.courseId, scope.moduleId)` for context lookup

### 8. `questionnaireResponses` - User Questionnaire Submissions

**Purpose**: Store user responses to questionnaire assignments with scoring
**Document ID**: `${uid}_${assignmentId}` (deterministic)
**Security**: User can read/write own responses only
**Key Features**: Answer validation, automatic scoring, completion tracking

```typescript
interface QuestionnaireResponseDoc {
  uid: string; // User reference
  assignmentId: string; // Assignment reference
  questionnaireId: string; // Template reference (denormalized)

  // Response context (denormalized for performance)
  scope: {
    type: "course" | "module";
    courseId: string;
    moduleId?: string;
  };

  // User answers
  answers: {
    questionId: string; // Question reference
    value: string | number | string[] | number[]; // Answer value(s)
  }[];

  // Completion and scoring
  isComplete: boolean; // Submission status
  score?: {
    earned: number; // Points earned (for quiz/assessment)
    total: number; // Total possible points
    percentage: number; // Percentage score (0-100)
  };

  // Timestamps
  submittedAt?: Timestamp; // Final submission timestamp
  createdAt: Timestamp; // Response creation (for started responses)
  updatedAt: Timestamp; // Last modification
}
```

**Relationships**:

- References: `questionnaireResponses.uid` → `users.uid`, `questionnaireResponses.assignmentId` → `questionnaireAssignments.id`
- Composite index: `(uid, assignmentId, submittedAt DESC)` for user history

## Infrastructure Collections

### 9. `loginEvents` - Login History and Streak Tracking

**Purpose**: Track user login events for streak calculation and analytics
**Document ID**: Auto-generated with timestamp
**Security**: Server-only access
**Key Features**: Daily streak calculation, login source tracking

```typescript
interface LoginEventDoc {
  uid: string; // User reference
  source: "web" | "mobile"; // Login source platform
  utcDate: string; // UTC date string (YYYY-MM-DD) for streak calculation
  timestamp: Timestamp; // Precise login timestamp
}
```

### 10. `idempotentWrites` - Idempotency Key Tracking

**Purpose**: Prevent duplicate operations by tracking idempotency keys
**Document ID**: Hashed idempotency key
**Security**: Server-only access
**Key Features**: 24-hour expiration, automatic cleanup

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

### 11. `adminAuditLogs` - Administrative Action Audit Trail

**Purpose**: Log all administrative actions for compliance and debugging
**Document ID**: Auto-generated
**Security**: Server-only access
**Key Features**: Change tracking, actor identification, resource context

```typescript
interface AdminAuditLogDoc {
  actorUid: string; // Admin who performed the action
  action: string; // Action type (e.g., "course.create", "module.update")
  target: {
    type: "course" | "module" | "questionnaire" | "assignment"; // Resource type
    id: string; // Resource ID
    title?: string; // Resource title for readability
  };
  before?: Record<string, unknown>; // State before change (optional)
  after?: Record<string, unknown>; // State after change (optional)
  timestamp: Timestamp; // Action timestamp
}
```

## Document ID Patterns

The system uses structured document IDs for efficient lookups and to establish relationships:

### Deterministic IDs (User-owned data)

- **Enrollments**: `${uid}_${courseId}` - Ensures one enrollment per user per course
- **Progress**: `${uid}_${courseId}_${moduleId}` - Unique module completion tracking
- **Questionnaire Responses**: `${uid}_${assignmentId}` - One response per user per assignment

### Auto-generated IDs (Admin-owned resources)

- **Courses**: Auto-generated by Firestore for security
- **Modules**: Auto-generated, referenced by courseId field
- **Questionnaires**: Auto-generated for template isolation
- **Assignments**: Auto-generated for flexible assignment management

### Utility Functions

```typescript
// Helper functions for ID generation (from lib/firestore.ts)
export const enrollmentId = (uid: string, courseId: string) =>
  `${uid}_${courseId}`;
export const progressId = (uid: string, courseId: string, moduleId: string) =>
  `${uid}_${courseId}_${moduleId}`;
export const responseId = (uid: string, assignmentId: string) =>
  `${uid}_${assignmentId}`;
```

## Composite Indexes

### Required Indexes for Query Performance

1. **Admin Course Management**

   ```json
   {
     "collectionGroup": "courses",
     "fields": [
       { "fieldPath": "ownerUid", "order": "ASCENDING" },
       { "fieldPath": "archived", "order": "ASCENDING" },
       { "fieldPath": "updatedAt", "order": "DESCENDING" }
     ]
   }
   ```

2. **Public Course Catalog**

   ```json
   {
     "collectionGroup": "courses",
     "fields": [
       { "fieldPath": "published", "order": "ASCENDING" },
       { "fieldPath": "archived", "order": "ASCENDING" },
       { "fieldPath": "publishedAt", "order": "DESCENDING" }
     ]
   }
   ```

3. **Module Ordering**

   ```json
   {
     "collectionGroup": "courseModules",
     "fields": [
       { "fieldPath": "courseId", "order": "ASCENDING" },
       { "fieldPath": "index", "order": "ASCENDING" }
     ]
   }
   ```

4. **User Enrollment History**

   ```json
   {
     "collectionGroup": "enrollments",
     "fields": [
       { "fieldPath": "uid", "order": "ASCENDING" },
       { "fieldPath": "enrolledAt", "order": "DESCENDING" }
     ]
   }
   ```

5. **Questionnaire Assignment Context**

   ```json
   {
     "collectionGroup": "questionnaireAssignments",
     "fields": [
       { "fieldPath": "scope.courseId", "order": "ASCENDING" },
       { "fieldPath": "scope.moduleId", "order": "ASCENDING" }
     ]
   }
   ```

6. **User Response History**

   ```json
   {
     "collectionGroup": "questionnaireResponses",
     "fields": [
       { "fieldPath": "uid", "order": "ASCENDING" },
       { "fieldPath": "assignmentId", "order": "ASCENDING" },
       { "fieldPath": "submittedAt", "order": "DESCENDING" }
     ]
   }
   ```

7. **Admin Questionnaire Management**
   ```json
   {
     "collectionGroup": "questionnaires",
     "fields": [
       { "fieldPath": "ownerUid", "order": "ASCENDING" },
       { "fieldPath": "archived", "order": "ASCENDING" },
       { "fieldPath": "updatedAt", "order": "DESCENDING" }
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

    // PROTECTED: Module content (API access only)
    match /courseModules/{moduleId} {
      allow read, write: if false; // Server-side API only
    }

    // USER-OWNED: Profile data with role protection
    match /users/{uid} {
      allow read, update: if isOwner(uid) && immut('role');
      allow create: if isOwner(uid);
      allow delete: if false;
    }

    // USER-OWNED: Enrollments with immutable keys
    match /enrollments/{enrollmentId} {
      allow create: if isSignedIn() &&
                       request.resource.data.uid == request.auth.uid;
      allow read, update: if isSignedIn() &&
                             resource.data.uid == request.auth.uid &&
                             immut('uid') && immut('courseId');
      allow delete: if false;
    }

    // USER-OWNED: Progress tracking with immutable keys
    match /progress/{progressId} {
      allow create: if isSignedIn() &&
                       request.resource.data.uid == request.auth.uid;
      allow read, update: if isSignedIn() &&
                             resource.data.uid == request.auth.uid &&
                             immut('uid') && immut('courseId') &&
                             immut('moduleId');
      allow delete: if false;
    }

    // USER-OWNED: Questionnaire responses with immutable keys
    match /questionnaireResponses/{responseId} {
      allow create: if isSignedIn() &&
                       request.resource.data.uid == request.auth.uid;
      allow read, update: if isSignedIn() &&
                             resource.data.uid == request.auth.uid &&
                             immut('uid') && immut('assignmentId') &&
                             immut('questionnaireId');
      allow delete: if false;
    }

    // ADMIN-ONLY: Server-managed collections
    match /questionnaires/{qid} {
      allow read, write: if false; // Admin SDK only
    }
    match /questionnaireAssignments/{aid} {
      allow read, write: if false; // Admin SDK only
    }
    match /loginEvents/{eventId} {
      allow read, write: if false; // Server tracking only
    }
    match /idempotentWrites/{id} {
      allow read, write: if false; // Server infrastructure only
    }
    match /adminAuditLogs/{logId} {
      allow read, write: if false; // Audit trail protection
    }

    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Security Features

- **Role-Based Access**: User/admin role separation with server-side enforcement
- **Ownership Isolation**: Admin resources isolated by `ownerUid` field
- **Immutable Fields**: Critical fields protected from client-side modification
- **Public Filtering**: Only published, non-archived courses visible to public
- **Audit Protection**: Admin actions logged with tamper-proof audit trail

## Relationships and Data Flow

### Course Management Flow

1. **Admin creates course** → `courses` collection
2. **Admin adds modules** → `courseModules` collection with `courseId` reference
3. **Course published** → Available in public catalog via security rules
4. **User enrolls** → `enrollments` collection with course counter increment
5. **User completes modules** → `progress` collection with enrollment updates

### Questionnaire Assessment Flow

1. **Admin creates questionnaire** → `questionnaires` collection
2. **Admin assigns to course/module** → `questionnaireAssignments` collection
3. **User accesses course/module** → Assignment discovery via API
4. **User submits responses** → `questionnaireResponses` collection
5. **Automatic scoring** → Updates gating flags in enrollment/progress

### Progress Tracking System

- **Module Completion**: Individual `progress` documents track module-level completion
- **Course Progress**: Denormalized in `enrollments` for dashboard performance
- **Resume Logic**: `lastModuleIndex` provides linear progression tracking
- **Gating Control**: Questionnaire completion gates access to content

## Performance Optimizations

### Denormalization Strategy

- **Course Counters**: `moduleCount`, `enrollmentCount`, `completionCount` cached in course documents
- **Progress Aggregation**: `progressPct`, `completedCount` cached in enrollment documents
- **Context Data**: Assignment scope and questionnaire ID denormalized in responses

### Query Optimization

- **Composite Indexes**: All queries backed by appropriate indexes
- **Ownership Filtering**: Admin queries filtered by `ownerUid` for data isolation
- **Memory Sorting**: Client-side sorting for small datasets to avoid additional indexes
- **Deterministic IDs**: Direct document access without collection queries

### Caching Considerations

- **Static Content**: Course catalog data suitable for CDN caching
- **User Progress**: Real-time updates require fresh data
- **Admin Dashboards**: Moderate caching acceptable for management interfaces

## Data Consistency and Transactions

### Transactional Operations

- **Enrollment Creation**: Atomically creates enrollment and increments course counter
- **Progress Updates**: Updates progress document and enrollment statistics together
- **Module Reordering**: Updates multiple module index values atomically
- **Course Publishing**: Updates course status and sets timestamp atomically

### Idempotency Support

- **Critical Operations**: Enrollment, progress completion, questionnaire submission
- **Key Storage**: 24-hour retention in `idempotentWrites` collection
- **Automatic Cleanup**: Expired keys removed by background functions

### Data Integrity Checks

- **Ownership Validation**: Server-side verification of admin resource ownership
- **Enrollment Verification**: Progress updates require valid enrollment
- **Questionnaire Versioning**: Frozen templates ensure response consistency
- **Reference Validation**: Foreign key relationships validated server-side

## Migration and Maintenance

### Schema Evolution

- **Backward Compatibility**: New fields added as optional to avoid breaking changes
- **Migration Scripts**: Server-side utilities for bulk data updates
- **Version Tracking**: Schema version stored in system metadata
- **Rollback Procedures**: Backup and restore capabilities for schema changes

### Data Archiving

- **Soft Delete**: `archived` flag with timestamp and actor tracking
- **Retention Policy**: Long-term storage for compliance and analytics
- **Cleanup Automation**: Background functions for expired temporary data
- **Export Capabilities**: Data export for migration and backup purposes

This comprehensive database schema supports a full-featured learning management system with robust security, performance optimization, and administrative capabilities.

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
- **Composite Indexes**: 8 production-deployed indexes for optimal query performance
- **Security Rules**: Comprehensive ownership model with archiving support - fully deployed
- **API Coverage**: 55+ endpoints providing complete CRUD operations with ownership enforcement
- **Archiving System**: Soft delete across all major collections with audit trail
- **Counter Management**: Denormalized performance counters with real-time updates
- **Data Integrity**: Transactional updates, idempotency keys, and referential integrity validation
- **Performance**: Optimized for real-time interactions with denormalized data and strategic indexing
- **Content Management**: Multi-format content support with comprehensive validation
- **Wizard Integration**: Seamless frontend-backend communication for course creation

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

- Denormalized counters in course documents (`enrollmentCount`, `completionCount`, `moduleCount`)
- Progress percentage calculated and stored in enrollment documents
- Composite indexes support all query patterns without additional lookups
- Module ordering with indexed retrieval by `(courseId, index asc)`
- Asset ordering with in-memory management for optimal performance

## Recent Enhancements

### Course Creation Wizard Integration

The database schema has been enhanced to support the advanced 4-step course creation wizard:

#### Module Content Validation

- **Text Content**: Requires `body` field when `contentType: "text"`
- **Media Content**: Requires `contentUrl` field for video, PDF, image, and link types
- **Estimation**: `estMinutes` field is required with minimum value of 1

#### Assessment Integration

- Course-level pre/post assessment assignment via `questionnaireAssignments`
- Module-level assessment assignment with inherited course context
- Automated gating logic with completion tracking in `progress` and `enrollments`

#### Auto-save and Draft Management

- Course drafts created with `published: false` status
- Module incremental updates with automatic indexing
- Real-time counter updates for UI consistency

#### Content Type Support

Enhanced module content system supporting:

- **Text**: Rich text/markdown content stored in `body` field
- **Video**: External URLs with metadata extraction
- **PDF**: File uploads with Firebase Storage integration
- **Image**: Visual content with responsive sizing
- **Link**: External resource references with validation

### Audit and Monitoring Enhancements

#### Admin Audit Logs

```typescript
interface AdminAuditLogDoc {
  adminUid: string; // Admin performing action
  action: string; // Action type (course.create, module.update, etc.)
  resourceType: string; // Resource affected (course, module, questionnaire)
  resourceId: string; // Resource identifier
  details: Record<string, any>; // Action-specific details
  timestamp: Timestamp; // Action timestamp
}
```

#### Content Validation System

- Schema-driven validation with detailed error reporting
- Content type enforcement with automatic detection
- File size and format validation for uploads
- URL validation for external resources

## Development and Testing

### Local Development

```bash
# Start Firestore emulator with UI
firebase emulators:start --only firestore

# Initialize database with comprehensive sample data
npm run seed:dev

# Deploy security rules to emulator
firebase deploy --only firestore:rules --project demo-project

# Test course creation wizard flow
npm run test:wizard
```

### Production Deployment

- All 8 composite indexes deployed via Firebase CLI
- Security rules deployed and active with enhanced ownership model
- Backup and recovery procedures with point-in-time restoration
- Real-time monitoring with automated alerting for query performance
- Content validation and sanitization at API boundaries
- Archive cleanup policies for data retention
