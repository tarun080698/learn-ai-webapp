# Database Schema Reference

## Overview

The Learn AI platform uses **Firebase Firestore**, a NoSQL document database. The schema is designed for a learning management system with course enrollment, progress tracking, and questionnaire-based assessments.

### Database Architecture

- **Document Store**: NoSQL with flexible schema
- **Collections**: Top-level containers for related documents
- **Subcollections**: None used (flat structure for simpler queries)
- **Relationships**: Foreign keys via document IDs
- **Denormalization**: Strategic duplication for performance

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
**Security**: Public read (published only), server-write only

```typescript
interface CourseDoc {
  title: string; // Course display name
  description: string; // Course overview
  durationMinutes: number; // Estimated completion time
  level: "beginner" | "intermediate" | "advanced";
  published: boolean; // Visibility flag
  heroImageUrl?: string; // Course thumbnail
  moduleCount: number; // Denormalized count
  publishedAt?: Timestamp; // Publication date
  createdAt: Timestamp; // Creation date
  updatedAt: Timestamp; // Last modification
}
```

**Relationships**:

- `courseModules.courseId` → `courses.id`
- `enrollments.courseId` → `courses.id`

### `courseModules`

**Purpose**: Individual learning modules within courses
**Document ID**: Auto-generated
**Security**: Public read (published only), server-write only

```typescript
interface ModuleDoc {
  courseId: string; // Parent course reference
  index: number; // Module order (0-based)
  title: string; // Module display name
  summary: string; // Module description
  contentType: "video" | "text" | "pdf" | "link";
  contentUrl?: string; // External content link
  body?: string; // Inline text content
  estMinutes: number; // Estimated time
  published: boolean; // Mirrors course.published
  updatedAt: Timestamp; // Last modification
}
```

**Relationships**:

- `courseModules.courseId` → `courses.id`
- `progress.moduleId` → `courseModules.id`

**Constraints**:

- `index` must be unique within each `courseId`
- `published` flag cascades from parent course

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
  lastModuleIndex: number; // Resume pointer
  completedCount: number; // Modules completed (denormalized)
  progressPct: number; // Completion percentage (0-100)
  preCourseComplete?: boolean; // Pre-course questionnaire gating
  postCourseComplete?: boolean; // Post-course questionnaire gating
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
}
```

**Relationships**:

- `progress.uid` → `users.uid`
- `progress.courseId` → `courses.id`
- `progress.moduleId` → `courseModules.id`

### `questionnaires`

**Purpose**: Questionnaire templates with versioning
**Document ID**: Auto-generated
**Security**: Server-only access (no client reads)

```typescript
interface QuestionnaireDoc {
  title: string; // Template name
  description?: string; // Template description
  purpose: "survey" | "quiz" | "mixed";
  version: number; // Auto-incrementing version
  questions: QuestionnaireQuestion[];
  createdAt: Timestamp; // Creation date
  updatedAt: Timestamp; // Last modification
}

interface QuestionnaireQuestion {
  id: string; // Unique within questionnaire
  type: "single" | "multi" | "scale" | "text";
  prompt: string; // Question text
  required: boolean; // Validation flag
  options?: string[]; // For single/multi choice
  scaleMin?: number; // For scale questions
  scaleMax?: number; // For scale questions
  correctAnswer?: string | string[]; // For quiz scoring
}
```

**Notes**:

- Version control prevents breaking changes to active assignments
- Questions array allows flexible question types

### `questionnaireAssignments`

**Purpose**: Questionnaire assignments to courses/modules
**Document ID**: Auto-generated
**Security**: Server-only access

```typescript
interface QuestionnaireAssignmentDoc {
  questionnaireId: string; // Template reference
  questionnaireVersion: number; // Frozen version
  scope: {
    type: "course" | "module";
    courseId: string;
    moduleId?: string; // Required if type=module
  };
  timing: "pre" | "post"; // When to present
  active: boolean; // Assignment enabled
  createdAt: Timestamp; // Assignment date
}
```

**Relationships**:

- `questionnaireAssignments.questionnaireId` → `questionnaires.id`
- `questionnaireAssignments.scope.courseId` → `courses.id`
- `questionnaireAssignments.scope.moduleId` → `courseModules.id`

### `questionnaireResponses`

**Purpose**: User responses to questionnaire assignments
**Document ID**: `${uid}_${assignmentId}`
**Security**: Owner read/write access

```typescript
interface QuestionnaireResponseDoc {
  uid: string; // User reference
  assignmentId: string; // Assignment reference
  questionnaireId: string; // Template reference (denormalized)
  questionnaireVersion: number; // Template version (denormalized)
  answers: QuestionnaireAnswer[];
  score?: number; // Quiz score (0-100)
  submittedAt: Timestamp; // Submission date
}

interface QuestionnaireAnswer {
  questionId: string; // Question reference
  value?: string; // Single choice / text answer
  values?: string[]; // Multi choice answer
}
```

**Relationships**:

- `questionnaireResponses.uid` → `users.uid`
- `questionnaireResponses.assignmentId` → `questionnaireAssignments.id`

### `loginEvents`

**Purpose**: Authentication audit trail
**Document ID**: Auto-generated
**Security**: Server-only access

```typescript
interface LoginEventDoc {
  uid: string; // User reference
  email?: string; // User email (denormalized)
  provider: string; // Authentication provider
  timestamp: Timestamp; // Login time
  dayKey: string; // UTC date (YYYY-MM-DD)
}
```

**Purpose**: Used for streak calculation and audit logging

### `idempotentWrites`

**Purpose**: Idempotency key tracking
**Document ID**: SHA-256 hash of idempotency key
**Security**: Server-only access

```typescript
interface IdempotentWriteDoc {
  key: string; // Original idempotency key
  uid: string; // User who made request
  endpoint: string; // API endpoint
  result: any; // Cached response
  createdAt: Timestamp; // First request time
  expiresAt: Timestamp; // Cleanup time
}
```

**Purpose**: Prevents duplicate operations on enrollment, progress, and responses

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

```javascript
// Course modules ordered by index
{
  collection: "courseModules",
  fields: [
    { field: "courseId", order: "ASC" },
    { field: "index", order: "ASC" }
  ]
}

// User enrollments by date
{
  collection: "enrollments",
  fields: [
    { field: "uid", order: "ASC" },
    { field: "enrolledAt", order: "DESC" }
  ]
}

// User progress by course
{
  collection: "progress",
  fields: [
    { field: "uid", order: "ASC" },
    { field: "courseId", order: "ASC" }
  ]
}

// Questionnaire assignments by scope
{
  collection: "questionnaireAssignments",
  fields: [
    { field: "scope.type", order: "ASC" },
    { field: "scope.courseId", order: "ASC" },
    { field: "active", order: "ASC" }
  ]
}

// Module-specific assignments
{
  collection: "questionnaireAssignments",
  fields: [
    { field: "scope.type", order: "ASC" },
    { field: "scope.courseId", order: "ASC" },
    { field: "scope.moduleId", order: "ASC" },
    { field: "active", order: "ASC" }
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
