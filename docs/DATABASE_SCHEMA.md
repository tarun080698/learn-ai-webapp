# Database Schema Documentation

This document outlines the complete database schema for the Learn.ai 4all application.

## Collections

### `courses`

**Purpose**: Store course information and metadata
**Document ID**: Auto-generated or specified
**Fields**:

- `title`: string - Course title
- `description`: string - Course description
- `durationMinutes`: number - Course duration in minutes
- `level`: "beginner" | "intermediate" | "advanced" - Course difficulty level
- `heroImageUrl`: string (optional) - URL to course hero image
- `published`: boolean - Whether course is published
- `moduleCount`: number - Number of modules in course
- `ownerUid`: string - UID of course creator
- `createdAt`: Date - Course creation timestamp
- `updatedAt`: Date - Last update timestamp

### `courseModules`

**Purpose**: Store module information and content
**Document ID**: Auto-generated
**Fields**:

- `courseId`: string - Parent course ID
- `index`: number - Module order within course
- `title`: string - Module title
- `summary`: string - Module summary/description
- `body`: string (optional) - Rich text content for text modules
- `contentType`: "video" | "text" | "pdf" | "image" | "link" - Module content type
- `contentUrl`: string (optional) - URL for non-text content
- `estMinutes`: number - Estimated completion time in minutes
- `assets`: Asset[] - Array of module assets
- `published`: boolean - Whether module is published (mirrors parent course)
- `ownerUid`: string - UID of module creator (inherited from course)
- `updatedAt`: Date - Last update timestamp

#### Asset Structure (within module document)

```typescript
{
  id: string,              // Unique asset identifier
  kind: "pdf" | "video" | "image" | "link", // Asset type
  url: string,             // Asset URL
  title: string,           // Asset title
  order: number,           // Asset order within module
  meta: {                  // Asset metadata
    description?: string,  // Asset description
    size?: number,         // File size in bytes
    originalName?: string, // Original filename
    type?: string,         // MIME type
    [key: string]: any     // Additional metadata
  }
}
```

### `questionnaires`

**Purpose**: Store questionnaire definitions
**Document ID**: Auto-generated
**Fields**:

- `title`: string - Questionnaire title
- `purpose`: "survey" | "quiz" | "assessment" - Questionnaire type
- `questions`: Question[] - Array of questions
- `ownerUid`: string - UID of questionnaire creator
- `createdAt`: Date - Creation timestamp
- `updatedAt`: Date - Last update timestamp

### `questionnaireAssignments`

**Purpose**: Link questionnaires to courses/modules with timing
**Document ID**: Auto-generated
**Fields**:

- `questionnaireId`: string - Reference to questionnaire
- `scope`: Object - Assignment scope
  - `type`: "course" | "module" - Assignment level
  - `courseId`: string - Course ID
  - `moduleId`: string (optional) - Module ID if type is "module"
- `timing`: "pre" | "post" - When to show questionnaire
- `active`: boolean - Whether assignment is active
- `ownerUid`: string - UID of assignment creator
- `createdAt`: Date - Creation timestamp
- `updatedAt`: Date - Last update timestamp

### `enrollments`

**Purpose**: Track user course enrollments
**Document ID**: `{userId}_{courseId}`
**Fields**:

- `userId`: string - Enrolled user ID
- `courseId`: string - Course ID
- `enrolledAt`: Date - Enrollment timestamp
- `completedAt`: Date (optional) - Completion timestamp
- `progress`: number - Completion percentage (0-100)

### `progress`

**Purpose**: Track user progress within modules
**Document ID**: `{userId}_{courseId}_{moduleId}`
**Fields**:

- `userId`: string - User ID
- `courseId`: string - Course ID
- `moduleId`: string - Module ID
- `moduleIndex`: number - Module order index
- `completedAt`: Date - Completion timestamp
- `timeSpent`: number - Time spent in minutes

### `questionnaireResponses`

**Purpose**: Store user responses to questionnaires
**Document ID**: Auto-generated
**Fields**:

- `userId`: string - User ID
- `questionnaireId`: string - Questionnaire ID
- `assignmentId`: string - Assignment ID
- `responses`: Object[] - Array of question responses
- `submittedAt`: Date - Submission timestamp
- `score`: number (optional) - Calculated score for quizzes

## Data Flow

1. **Course Creation**: Creates course document, then modules with assets
2. **Module Assets**: Stored as array within module document for atomic updates
3. **Questionnaire Assignment**: Links questionnaires to courses/modules
4. **User Enrollment**: Creates enrollment record and tracks progress
5. **Progress Tracking**: Updates progress documents as users complete modules

## Key Relationships

- Course → Modules (one-to-many via courseId)
- Course → Assignments (one-to-many via scope.courseId)
- Module → Assets (one-to-many via embedded array)
- Questionnaire → Assignments (one-to-many via questionnaireId)
- User → Enrollments (one-to-many via userId)
- User → Progress (one-to-many via userId)
- User → Responses (one-to-many via userId)
