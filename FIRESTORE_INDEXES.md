# Firestore Indexes Required

The following composite indexes need to be configured in the Firestore console for optimal performance:

## Required Composite Indexes

### 1. Course Modules by Course and Order

**Collection:** `courseModules`
**Fields:**

- `courseId` (Ascending)
- `index` (Ascending)

**Purpose:** Efficient module ordering queries in course detail pages

### 2. Questionnaire Assignments by Course Scope

**Collection:** `questionnaireAssignments`
**Fields:**

- `scope.courseId` (Ascending)
- `scope.type` (Ascending)
- `active` (Ascending)

**Purpose:** Finding active assignments for course-level gating

### 3. Questionnaire Assignments by Module Scope

**Collection:** `questionnaireAssignments`
**Fields:**

- `scope.courseId` (Ascending)
- `scope.moduleId` (Ascending)
- `active` (Ascending)

**Purpose:** Finding active assignments for module-level gating

### 4. User Enrollments by Date

**Collection:** `enrollments`
**Fields:**

- `uid` (Ascending)
- `enrolledAt` (Descending)

**Purpose:** User's enrollment history and activity tracking

### 5. Admin Course Management

**Collection:** `courses`
**Fields:**

- `ownerUid` (Ascending)
- `archived` (Ascending)
- `updatedAt` (Descending)

**Purpose:** Admin course listing with archiving filter

### 6. Admin Course Management (Alternative)

**Collection:** `courses`
**Fields:**

- `ownerUid` (Ascending)
- `updatedAt` (Descending)

**Purpose:** Admin course listing without archiving filter

### 7. Public Course Catalog

**Collection:** `courses`
**Fields:**

- `published` (Ascending)
- `archived` (Ascending)
- `publishedAt` (Descending)

**Purpose:** Public catalog with proper filtering (if using publishedAt sorting)

### 8. Public Course Catalog (Alternative)

**Collection:** `courses`
**Fields:**

- `published` (Ascending)
- `createdAt` (Descending)

**Purpose:** Public catalog sorted by creation date

## Single Field Indexes (Auto-created)

These are automatically created by Firestore:

- `courseId` on courseModules collection
- `uid` on enrollments collection
- `published` on courses collection
- `active` on questionnaireAssignments collection
- `ownerUid` on courses, questionnaires collections

## Index Creation Commands (Firebase CLI)

If using Firebase CLI, you can create these indexes with:

```bash
firebase firestore:indexes
```

Or create individual indexes:

```bash
# Example for courseModules index
firebase firestore:indexes:create \
  --collection-group courseModules \
  --field-path courseId --order ASC \
  --field-path index --order ASC
```

## Verification

After creating indexes, verify they're active in:

1. Firebase Console > Firestore > Indexes
2. Look for "Building" vs "Enabled" status
3. Test queries in your application

## Performance Notes

- Indexes may take several minutes to build
- Large collections may require hours for index creation
- Consider query patterns when adding new fields to avoid additional index requirements
- Some queries can work with existing indexes if query structure matches
