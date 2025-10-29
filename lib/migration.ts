/**
 * Migration utilities for backfilling new fields in existing documents
 * Used by dev-only migration endpoint to update existing data structures
 */

import { COL } from "./firestore";

/**
 * Migration interface for tracking migration status
 */
export interface MigrationResult {
  success: boolean;
  message: string;
  processed: number;
  errors: string[];
}

/**
 * Backfill courses with new ownership and counter fields
 */
export async function migrateCourses(
  db: FirebaseFirestore.Firestore,
  defaultOwnerUid: string
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    message: "",
    processed: 0,
    errors: [],
  };

  try {
    const coursesSnapshot = await db.collection(COL.courses).get();
    const batch = db.batch();

    for (const doc of coursesSnapshot.docs) {
      const data = doc.data();
      const updates: Record<string, unknown> = {};

      // Add ownerUid if missing
      if (!data.ownerUid) {
        updates.ownerUid = defaultOwnerUid;
      }

      // Add archived field if missing
      if (typeof data.archived !== "boolean") {
        updates.archived = false;
        updates.archivedAt = null;
        updates.archivedBy = null;
      }

      // Add counter fields if missing
      if (typeof data.enrollmentCount !== "number") {
        updates.enrollmentCount = 0;
      }

      if (typeof data.completionCount !== "number") {
        updates.completionCount = 0;
      }

      // Add moduleCount if missing (computed field)
      if (typeof data.moduleCount !== "number") {
        const moduleSnapshot = await db
          .collection(COL.modules)
          .where("courseId", "==", doc.id)
          .get();
        updates.moduleCount = moduleSnapshot.size;
      }

      // Add updatedAt if missing
      if (!data.updatedAt) {
        updates.updatedAt = data.createdAt || new Date();
      }

      if (Object.keys(updates).length > 0) {
        batch.update(doc.ref, updates);
        result.processed++;
      }
    }

    await batch.commit();
    result.message = `Successfully migrated ${result.processed} courses`;
  } catch (error) {
    result.success = false;
    result.message = `Migration failed: ${error}`;
    result.errors.push(String(error));
  }

  return result;
}

/**
 * Backfill modules with new ownership and archive fields
 */
export async function migrateModules(
  db: FirebaseFirestore.Firestore
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    message: "",
    processed: 0,
    errors: [],
  };

  try {
    const modulesSnapshot = await db.collection(COL.modules).get();
    const batch = db.batch();

    for (const doc of modulesSnapshot.docs) {
      const data = doc.data();
      const updates: Record<string, unknown> = {};

      // Inherit ownerUid from parent course
      if (!data.ownerUid && data.courseId) {
        const courseDoc = await db
          .collection(COL.courses)
          .doc(data.courseId)
          .get();
        const courseData = courseDoc.data();
        if (courseData?.ownerUid) {
          updates.ownerUid = courseData.ownerUid;
        }
      }

      // Add archived field if missing
      if (typeof data.archived !== "boolean") {
        updates.archived = false;
        updates.archivedAt = null;
        updates.archivedBy = null;
      }

      // Ensure assets array exists
      if (!Array.isArray(data.assets)) {
        updates.assets = [];
      }

      // Add updatedAt if missing
      if (!data.updatedAt) {
        updates.updatedAt = data.createdAt || new Date();
      }

      if (Object.keys(updates).length > 0) {
        batch.update(doc.ref, updates);
        result.processed++;
      }
    }

    await batch.commit();
    result.message = `Successfully migrated ${result.processed} modules`;
  } catch (error) {
    result.success = false;
    result.message = `Migration failed: ${error}`;
    result.errors.push(String(error));
  }

  return result;
}

/**
 * Backfill questionnaires with new ownership and version fields
 */
export async function migrateQuestionnaires(
  db: FirebaseFirestore.Firestore,
  defaultOwnerUid: string
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    message: "",
    processed: 0,
    errors: [],
  };

  try {
    const questionnairesSnapshot = await db
      .collection(COL.questionnaires)
      .get();
    const batch = db.batch();

    for (const doc of questionnairesSnapshot.docs) {
      const data = doc.data();
      const updates: Record<string, unknown> = {};

      // Add ownerUid if missing
      if (!data.ownerUid) {
        updates.ownerUid = defaultOwnerUid;
      }

      // Add version field if missing (start at version 1)
      if (typeof data.version !== "number") {
        updates.version = 1;
      }

      // Add archived field if missing
      if (typeof data.archived !== "boolean") {
        updates.archived = false;
        updates.archivedAt = null;
        updates.archivedBy = null;
      }

      // Add updatedAt if missing
      if (!data.updatedAt) {
        updates.updatedAt = data.createdAt || new Date();
      }

      if (Object.keys(updates).length > 0) {
        batch.update(doc.ref, updates);
        result.processed++;
      }
    }

    await batch.commit();
    result.message = `Successfully migrated ${result.processed} questionnaires`;
  } catch (error) {
    result.success = false;
    result.message = `Migration failed: ${error}`;
    result.errors.push(String(error));
  }

  return result;
}

/**
 * Backfill assignments with new archive fields
 */
export async function migrateAssignments(
  db: FirebaseFirestore.Firestore
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    message: "",
    processed: 0,
    errors: [],
  };

  try {
    const assignmentsSnapshot = await db.collection(COL.assignments).get();
    const batch = db.batch();

    for (const doc of assignmentsSnapshot.docs) {
      const data = doc.data();
      const updates: Record<string, unknown> = {};

      // Add archived field if missing
      if (typeof data.archived !== "boolean") {
        updates.archived = false;
        updates.archivedAt = null;
        updates.archivedBy = null;
      }

      // Ensure active field exists (default to true for existing assignments)
      if (typeof data.active !== "boolean") {
        updates.active = true;
      }

      // Add questionnaireVersion if missing (need to sync with questionnaire)
      if (!data.questionnaireVersion && data.questionnaireId) {
        const questionnaireDoc = await db
          .collection(COL.questionnaires)
          .doc(data.questionnaireId)
          .get();
        const questionnaireData = questionnaireDoc.data();
        if (questionnaireData?.version) {
          updates.questionnaireVersion = questionnaireData.version;
        }
      }

      if (Object.keys(updates).length > 0) {
        batch.update(doc.ref, updates);
        result.processed++;
      }
    }

    await batch.commit();
    result.message = `Successfully migrated ${result.processed} assignments`;
  } catch (error) {
    result.success = false;
    result.message = `Migration failed: ${error}`;
    result.errors.push(String(error));
  }

  return result;
}

/**
 * Recompute all course counters based on actual enrollment and progress data
 */
export async function recomputeCourseCounters(
  db: FirebaseFirestore.Firestore
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    message: "",
    processed: 0,
    errors: [],
  };

  try {
    const coursesSnapshot = await db.collection(COL.courses).get();
    const batch = db.batch();

    for (const courseDoc of coursesSnapshot.docs) {
      const courseId = courseDoc.id;

      // Count enrollments
      const enrollmentsSnapshot = await db
        .collection(COL.enrollments)
        .where("courseId", "==", courseId)
        .get();
      const enrollmentCount = enrollmentsSnapshot.size;

      // Count completions
      const completedEnrollments = enrollmentsSnapshot.docs.filter(
        (doc) => doc.data().status === "completed"
      );
      const completionCount = completedEnrollments.length;

      // Count modules
      const modulesSnapshot = await db
        .collection(COL.modules)
        .where("courseId", "==", courseId)
        .get();
      const moduleCount = modulesSnapshot.size;

      batch.update(courseDoc.ref, {
        enrollmentCount,
        completionCount,
        moduleCount,
        updatedAt: new Date(),
      });

      result.processed++;
    }

    await batch.commit();
    result.message = `Successfully recomputed counters for ${result.processed} courses`;
  } catch (error) {
    result.success = false;
    result.message = `Counter recomputation failed: ${error}`;
    result.errors.push(String(error));
  }

  return result;
}

/**
 * Run all migrations in sequence
 */
export async function runAllMigrations(
  db: FirebaseFirestore.Firestore,
  defaultOwnerUid: string
): Promise<MigrationResult[]> {
  const results: MigrationResult[] = [];

  console.log("Starting database migration...");

  // 1. Migrate courses
  console.log("Migrating courses...");
  results.push(await migrateCourses(db, defaultOwnerUid));

  // 2. Migrate modules
  console.log("Migrating modules...");
  results.push(await migrateModules(db));

  // 3. Migrate questionnaires
  console.log("Migrating questionnaires...");
  results.push(await migrateQuestionnaires(db, defaultOwnerUid));

  // 4. Migrate assignments
  console.log("Migrating assignments...");
  results.push(await migrateAssignments(db));

  // 5. Recompute counters
  console.log("Recomputing course counters...");
  results.push(await recomputeCourseCounters(db));

  console.log("Migration complete!");

  return results;
}
