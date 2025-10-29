import { NextRequest } from "next/server";
import { getUserFromRequest, requireAdmin, jsonError } from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { runAllMigrations } from "@/lib/migration";

/*
DEV-ONLY MIGRATION ENDPOINT

This endpoint is for development use only to backfill existing documents
with new fields required by the updated backend system.

DEV TESTING:
curl -X POST http://localhost:3000/api/dev/migrate \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "defaultOwnerUid": "admin-user-uid-here",
    "runMigrations": ["courses", "modules", "questionnaires", "assignments", "counters"]
  }'

RUN ALL MIGRATIONS:
curl -X POST http://localhost:3000/api/dev/migrate \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "defaultOwnerUid": "admin-user-uid-here"
  }'
*/

export async function POST(req: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === "production") {
      throw Object.assign(
        new Error("Migration endpoint disabled in production"),
        {
          status: 403,
          code: "migration_disabled_in_production",
        }
      );
    }

    // Verify admin authorization
    const user = await getUserFromRequest(req);
    requireAdmin(user);

    // Parse request body
    const body = await req.json();
    const { defaultOwnerUid, runMigrations } = body;

    if (!defaultOwnerUid || typeof defaultOwnerUid !== "string") {
      throw Object.assign(new Error("defaultOwnerUid is required"), {
        status: 400,
        code: "missing_default_owner_uid",
      });
    }

    if (!adminDb) {
      throw Object.assign(new Error("Firebase Admin not initialized"), {
        status: 500,
      });
    }

    console.log("Starting database migration...");
    console.log("Default owner UID:", defaultOwnerUid);
    console.log("Requested by admin:", user.uid);

    let results;

    if (runMigrations && Array.isArray(runMigrations)) {
      // Run specific migrations
      results = [];

      if (runMigrations.includes("courses")) {
        const { migrateCourses } = await import("@/lib/migration");
        results.push(await migrateCourses(adminDb, defaultOwnerUid));
      }

      if (runMigrations.includes("modules")) {
        const { migrateModules } = await import("@/lib/migration");
        results.push(await migrateModules(adminDb));
      }

      if (runMigrations.includes("questionnaires")) {
        const { migrateQuestionnaires } = await import("@/lib/migration");
        results.push(await migrateQuestionnaires(adminDb, defaultOwnerUid));
      }

      if (runMigrations.includes("assignments")) {
        const { migrateAssignments } = await import("@/lib/migration");
        results.push(await migrateAssignments(adminDb));
      }

      if (runMigrations.includes("counters")) {
        const { recomputeCourseCounters } = await import("@/lib/migration");
        results.push(await recomputeCourseCounters(adminDb));
      }
    } else {
      // Run all migrations
      results = await runAllMigrations(adminDb, defaultOwnerUid);
    }

    const totalProcessed = results.reduce(
      (sum, result) => sum + result.processed,
      0
    );
    const successCount = results.filter((result) => result.success).length;
    const errorCount = results.filter((result) => !result.success).length;
    const allErrors = results.flatMap((result) => result.errors);

    console.log("Migration complete. Results:", {
      totalMigrations: results.length,
      successCount,
      errorCount,
      totalProcessed,
    });

    return Response.json({
      ok: errorCount === 0,
      migration: {
        totalMigrations: results.length,
        successCount,
        errorCount,
        totalProcessed,
        requestedBy: user.uid,
        defaultOwnerUid,
        timestamp: new Date().toISOString(),
      },
      results,
      errors: allErrors,
      message:
        errorCount === 0
          ? `Migration completed successfully. ${totalProcessed} documents processed.`
          : `Migration completed with ${errorCount} errors. ${totalProcessed} documents processed.`,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return jsonError(error);
  }
}
