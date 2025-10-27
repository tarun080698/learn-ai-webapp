# Phase 2: Required Firestore Indexes

## Required Composite Indexes

### courseModules Collection

- **Index Name**: courseModules_courseId_index
- **Fields**:
  - `courseId` (ASC)
  - `index` (ASC)
- **Purpose**: For ordered module lists within a course
- **Query Pattern**:
  ```javascript
  db.collection("courseModules")
    .where("courseId", "==", courseId)
    .orderBy("index", "asc");
  ```

### enrollments Collection

- **Index Name**: enrollments_uid_enrolledAt
- **Fields**:
  - `uid` (ASC)
  - `enrolledAt` (DESC)
- **Purpose**: For user dashboard listing of enrollments by recency
- **Query Pattern**:
  ```javascript
  db.collection("enrollments")
    .where("uid", "==", userId)
    .orderBy("enrolledAt", "desc");
  ```

## Single Field Indexes (Automatic)

These are created automatically by Firestore:

- `courseModules.courseId`
- `enrollments.uid`
- `progress.uid`
- `progress.courseId`

## Phase 3 Preview (Coming Soon)

The following indexes will be needed in Phase 3 for questionnaires:

- `questionnaireAssignments.uid + dueDate`
- `questionnaireResponses.assignmentId + submittedAt`

## Error Messages to Watch For

If you see these errors in the console during testing, it means an index is missing:

```
The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/PROJECT_ID/firestore/indexes?create_composite=...
```

Click the link to auto-create the required index, or manually create using the specifications above.

## Creating Indexes

### Option 1: Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to Firestore Database → Indexes
4. Click "Create Index"
5. Enter the collection name and field specifications above

### Option 2: Firebase CLI

```bash
# Example index creation (add to firestore.indexes.json)
{
  "indexes": [
    {
      "collectionGroup": "courseModules",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "courseId", "order": "ASCENDING" },
        { "fieldPath": "index", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "enrollments",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "uid", "order": "ASCENDING" },
        { "fieldPath": "enrolledAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### Option 3: Auto-creation via Error Links

When you first run queries that need indexes, Firestore will show error messages with direct links to create the required indexes. This is often the easiest method during development.

## Index Build Time

- Simple indexes: Usually 1-2 minutes
- Composite indexes: Can take 5-30 minutes depending on collection size
- You can continue development while indexes build in the background
