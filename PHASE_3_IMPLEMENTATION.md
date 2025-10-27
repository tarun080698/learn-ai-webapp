# Phase 3 Implementation Summary

## Overview

Phase 3 has been successfully implemented, adding a comprehensive questionnaire system with gating functionality to the learning management system. This includes survey/quiz capabilities, admin template management, assignment workflows, and user response collection with scoring.

## Architecture

### Core Components

#### 1. **Type Definitions** (`types/models.ts`)

- `QuestionnaireQuestion`: Defines question types (single, multi, scale, text)
- `QuestionnaireDoc`: Template documents with versioning
- `QuestionnaireAssignmentDoc`: Assigns questionnaires to courses/modules with timing
- `QuestionnaireResponseDoc`: User responses with scoring
- Extended `EnrollmentDoc` and `ProgressDoc` with gating flags

#### 2. **Validation Schemas** (`lib/schemas.ts`)

- `zQuestionnaireUpsert`: Admin questionnaire creation/update
- `zAssignmentUpsert`: Admin assignment creation
- `zStart`: User questionnaire start
- `zSubmit`: User response submission

#### 3. **Database Helpers** (`lib/firestore.ts`)

- Assignment context retrieval
- Version verification for frozen templates
- Quiz scoring logic
- Gating requirement checks

## API Endpoints

### Admin APIs

#### `/api/admin/questionnaire.upsert`

- **Purpose**: Create/update questionnaire templates
- **Features**:
  - Version control (auto-increment)
  - Template validation
  - Admin authentication required
- **Body**: `{ title, description, type, questions, purpose }`

#### `/api/admin/assignment.upsert`

- **Purpose**: Assign questionnaires to courses/modules
- **Features**:
  - Version freezing (locks questionnaire version)
  - Scope definition (course/module level)
  - Timing control (pre/post)
- **Body**: `{ questionnaireId, scope: {type, courseId, moduleId?}, timing, active }`

### User APIs

#### `/api/questionnaires/context`

- **Purpose**: List assignments for course/module with completion status
- **Features**:
  - User-specific completion checking
  - Active assignment filtering
- **Body**: `{ courseId, moduleId? }`

#### `/api/questionnaires/start`

- **Purpose**: Begin questionnaire and get frozen template
- **Features**:
  - Version verification
  - Duplicate submission prevention
  - Assignment activation check
- **Body**: `{ assignmentId }`

#### `/api/questionnaires/submit`

- **Purpose**: Submit responses and update gating flags
- **Features**:
  - Answer validation against template
  - Quiz scoring (correct/incorrect answers)
  - Gating flag updates based on scope/timing
  - Response deduplication
- **Body**: `{ assignmentId, answers: [{questionId, value|values}] }`

### Module Access API

#### `/api/modules/access`

- **Purpose**: Check module access with gating requirements
- **Features**:
  - Pre-course/pre-module requirement checking
  - Blocking assignment identification
- **Body**: `{ courseId, moduleId }`

## Gating System

### Gating Flags

- **Pre-Course**: `preCourseComplete` (in EnrollmentDoc)
- **Post-Course**: `postCourseComplete` (in EnrollmentDoc)
- **Pre-Module**: `preModuleComplete` (in ProgressDoc)
- **Post-Module**: `postModuleComplete` (in ProgressDoc)

### Enforcement Points

#### Module Start Protection

- **Function**: `canStartModule()`
- **Checks**: Pre-course and pre-module questionnaire completion
- **Used By**: Frontend before allowing module access

#### Module Completion Protection

- **Function**: `canCompleteModule()`
- **Checks**: Post-module questionnaire completion
- **Used By**: `/api/progress` before marking module complete

### Gating Flow Examples

#### Pre-Course Questionnaire

1. Admin creates questionnaire template
2. Admin assigns to course with `timing: 'pre'`
3. User enrolls in course
4. User attempts to start first module → blocked
5. User completes pre-course questionnaire
6. System sets `preCourseComplete: true`
7. User can now access modules

#### Post-Module Survey

1. Admin creates survey template
2. Admin assigns to module with `timing: 'post'`
3. User completes module content
4. User attempts to mark module complete → blocked
5. User completes post-module survey
6. System sets `postModuleComplete: true`
7. Module marked as completed

## Question Types

### Single Choice

```typescript
{
  type: 'single',
  options: [
    { id: 'opt1', text: 'Option 1' },
    { id: 'opt2', text: 'Option 2' }
  ],
  correct: ['opt1'], // For quizzes
  points: 10 // For scoring
}
```

### Multiple Choice

```typescript
{
  type: 'multi',
  options: [...],
  correct: ['opt1', 'opt3'], // Multiple correct answers
  points: 15
}
```

### Scale Rating

```typescript
{
  type: 'scale',
  scale: { min: 1, max: 5, labels: ['Poor', 'Excellent'] }
}
```

### Text Response

```typescript
{
  type: 'text',
  placeholder: 'Enter your response...',
  required: true
}
```

## Version Control

### Template Versioning

- Questionnaires have auto-incrementing versions
- Assignments lock to specific questionnaire versions
- Prevents changes to active questionnaires affecting in-progress responses

### Version Verification

- `getAssignmentWithTemplate()` ensures version consistency
- Throws error if assignment version ≠ questionnaire version

## Scoring System

### Quiz Scoring

- Only questions with `correct` and `points` fields are scored
- Single choice: Exact match required
- Multiple choice: All correct answers must be selected, no incorrect ones
- Returns `{ earned, total }` points

### Response Storage

- Raw answers stored for auditing
- Computed scores stored for reporting
- Submission timestamps for analytics

## Database Schema

### Collections

- `questionnaires`: Template documents
- `questionnaire_assignments`: Assignment configurations
- `questionnaire_responses`: User submissions
- `enrollments`: Extended with course gating flags
- `progress`: Extended with module gating flags

### Document IDs

- Response ID: `${uid}_${assignmentId}`
- Enrollment ID: `${uid}_${courseId}`
- Progress ID: `${uid}_${courseId}_${moduleId}`

## Integration Points

### With Existing APIs

- **Enrollment API**: Unchanged (pre-course requirements don't block enrollment)
- **Progress API**: Enhanced with post-module gating checks
- **Module Access**: New API for frontend gating validation

### With Frontend

- Module access checks before navigation
- Questionnaire rendering from frozen templates
- Progress blocking with clear messaging
- Assignment discovery for required questionnaires

## Security

### Authentication

- Google provider required for users
- Admin role required for template/assignment management

### Authorization

- Users can only submit their own responses
- Response deduplication prevents gaming
- Template freezing prevents mid-flight changes

### Validation

- Zod schemas for all input validation
- Answer format validation against question types
- Required question enforcement

## Testing Endpoints

### Admin Workflow

```bash
# Create questionnaire
curl -X POST http://localhost:3000/api/admin/questionnaire.upsert \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"title":"Pre-Course Survey","type":"survey","questions":[...]}'

# Assign to course
curl -X POST http://localhost:3000/api/admin/assignment.upsert \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"questionnaireId":"q123","scope":{"type":"course","courseId":"c456"},"timing":"pre"}'
```

### User Workflow

```bash
# Check available questionnaires
curl -X POST http://localhost:3000/api/questionnaires/context \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"courseId":"c456"}'

# Start questionnaire
curl -X POST http://localhost:3000/api/questionnaires/start \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"assignmentId":"a789"}'

# Submit responses
curl -X POST http://localhost:3000/api/questionnaires/submit \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"assignmentId":"a789","answers":[{"questionId":"q1","value":"opt1"}]}'
```

## Status

✅ **Complete**: Backend APIs, types, schemas, gating logic
⏳ **Next Phase**: Frontend questionnaire UI components and integration

The questionnaire system is fully functional at the API level and ready for frontend integration.
