# Phase C Testing Examples

## Counter Integration Testing

### Enrollment Counter (with Idempotency)

```bash
# First enrollment - should increment course.enrollmentCount
curl -X POST http://localhost:3000/api/enroll \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: enroll-test-1" \
  -d '{
    "courseId": "course-123"
  }'

# Response should show: {"ok": true, "isNew": true, ...}

# Replay same request - should NOT increment counter again
curl -X POST http://localhost:3000/api/enroll \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: enroll-test-1" \
  -d '{
    "courseId": "course-123"
  }'

# Response should show: {"ok": true, "isNew": false, ...}
```

### Completion Counter (with Idempotency)

```bash
# Complete all modules to trigger course completion
curl -X POST http://localhost:3000/api/progress \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: complete-final-module" \
  -d '{
    "courseId": "course-123",
    "moduleId": "module-final",
    "moduleIndex": 2
  }'

# Response should show: {"ok": true, "completed": true, "courseCompletedFirstTime": true, ...}

# Replay same request - should NOT increment completion counter again
curl -X POST http://localhost:3000/api/progress \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-idempotency-key: complete-final-module" \
  -d '{
    "courseId": "course-123",
    "moduleId": "module-final",
    "moduleIndex": 2
  }'

# Response should show: {"ok": true, "completed": true, "courseCompletedFirstTime": false, ...}
```

## Smart Public Endpoints

### Catalog (Public with Optional Authentication)

```bash
# Public access (no auth)
curl -s http://localhost:3000/api/catalog | jq

# Authenticated access (with enrollment decoration)
curl -s http://localhost:3000/api/catalog \
  -H "Authorization: Bearer $USER_TOKEN" | jq
```

### Course Detail (Public with Metadata Only)

```bash
# Public course detail (published + non-archived only)
curl -s http://localhost:3000/api/courses/course-123 | jq

# Should return:
# - Course metadata only (no sensitive fields)
# - Module metadata only (id, index, title, estMinutes - no body/assets)
# - Only published and non-archived modules
# - Questionnaire assignments (active only)
```

## Admin Endpoints Testing

### Course Management

```bash
# Archive course
curl -X POST http://localhost:3000/api/admin/course.archive \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "course-123",
    "archived": true
  }'

# Verify archived course doesn't appear in public catalog
curl -s http://localhost:3000/api/catalog | jq '.courses[] | select(.id == "course-123")'
# Should return empty
```

### Module Management

```bash
# Reorder modules
curl -X POST http://localhost:3000/api/admin/modules.reorder \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "course-123",
    "order": [
      {"moduleId": "module-2", "index": 0},
      {"moduleId": "module-1", "index": 1},
      {"moduleId": "module-3", "index": 2}
    ]
  }'
```

### Asset Management

```bash
# Add asset to module
curl -X POST http://localhost:3000/api/admin/asset.add \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "moduleId": "module-123",
    "asset": {
      "kind": "pdf",
      "url": "https://example.com/document.pdf",
      "title": "Course Materials",
      "meta": {"pages": 10, "size": "2MB"}
    }
  }'

# Reorder assets
curl -X POST http://localhost:3000/api/admin/asset.reorder \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "moduleId": "module-123",
    "order": [
      {"assetId": "asset-2", "order": 0},
      {"assetId": "asset-1", "order": 1}
    ]
  }'

# Remove asset
curl -X POST http://localhost:3000/api/admin/asset.remove \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "moduleId": "module-123",
    "assetId": "asset-1"
  }'
```

### Questionnaire Create-and-Assign

```bash
# Create questionnaire and assign in one step
curl -X POST http://localhost:3000/api/admin/questionnaire.create-and-assign \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pre-Course Survey",
    "purpose": "survey",
    "questions": [
      {
        "id": "q1",
        "type": "single",
        "prompt": "What is your experience level?",
        "options": [
          {"id": "opt1", "label": "Beginner"},
          {"id": "opt2", "label": "Intermediate"},
          {"id": "opt3", "label": "Advanced"}
        ],
        "required": true
      }
    ],
    "scope": {
      "type": "course",
      "courseId": "course-123"
    },
    "timing": "pre"
  }'
```

### Assignment Management

```bash
# Update assignment scope/timing
curl -X POST http://localhost:3000/api/admin/assignment.update \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assignmentId": "assignment-123",
    "timing": "post",
    "active": true
  }'

# Archive assignment
curl -X POST http://localhost:3000/api/admin/assignment.archive \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assignmentId": "assignment-123",
    "archived": true
  }'

# Delete assignment (with safety checks)
curl -X POST http://localhost:3000/api/admin/assignment.delete \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assignmentId": "assignment-123"
  }'
```

## Migration Testing

```bash
# Run full migration (DEV ONLY)
curl -X POST http://localhost:3000/api/dev/migrate \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "defaultOwnerUid": "admin-user-uid-here"
  }'

# Run specific migrations
curl -X POST http://localhost:3000/api/dev/migrate \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "defaultOwnerUid": "admin-user-uid-here",
    "runMigrations": ["courses", "modules", "counters"]
  }'
```

## Validation Checklist

After running the above tests, verify:

✅ **Counter Idempotency:**

- Multiple enrollment requests don't inflate `enrollmentCount`
- Multiple progress completions don't inflate `completionCount`
- Counters only increment on first-time events

✅ **Public Filtering:**

- Archived courses/modules don't appear in public endpoints
- Unpublished courses return 404
- Public endpoints show only metadata (no sensitive fields)

✅ **Enrollment Decoration:**

- Authenticated catalog requests show `enrolled: true/false`
- Unauthenticated requests work without enrollment info

✅ **Admin Operations:**

- All admin endpoints require proper ownership
- Archive/unarchive works correctly
- Asset management preserves ordering
- Create-and-assign creates both questionnaire and assignment

✅ **Gating Logic:**

- `/api/questionnaires/context` returns only active assignments
- `/api/modules/access` respects gating requirements
- Archived assignments don't block user progress
