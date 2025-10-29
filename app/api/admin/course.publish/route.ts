import { NextRequest } from "next/server";
import { getUserFromRequest, requireAdmin, jsonError } from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { zPublish } from "@/lib/schemas";
import { COL } from "@/lib/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { logAdminAction } from "@/lib/adminAudit";

/*
DEV TESTING:
PUBLISH COURSE:
curl -X POST http://localhost:3000/api/admin/course.publish \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "course-123",
    "published": true
  }'

UNPUBLISH COURSE:
curl -X POST http://localhost:3000/api/admin/course.publish \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "course-123",
    "published": false
  }'
*/

export async function POST(req: NextRequest) {
  try {
    // Verify admin authorization
    const user = await getUserFromRequest(req);
    requireAdmin(user);

    // Parse and validate request body
    const body = await req.json();
    const parsed = zPublish.parse(body);

    if (!adminDb) {
      throw Object.assign(new Error("Firebase Admin not initialized"), {
        status: 500,
      });
    }

    // Verify course exists
    const courseDoc = await adminDb
      .collection(COL.courses)
      .doc(parsed.courseId)
      .get();
    if (!courseDoc.exists) {
      throw Object.assign(new Error("Course not found"), {
        status: 404,
        code: "course_not_found",
      });
    }

    // Verify course ownership
    const courseData = courseDoc.data();
    if (courseData?.ownerUid !== user.uid) {
      throw Object.assign(new Error("Access denied: not the course owner"), {
        status: 403,
        code: "course_access_denied",
      });
    }

    const now = new Date();

    // Prepare course update data
    const courseUpdate: Record<string, unknown> = {
      published: parsed.published,
      updatedAt: now,
    };

    // Set publishedAt timestamp when publishing, remove when unpublishing
    if (parsed.published) {
      courseUpdate.publishedAt = now;
    } else {
      courseUpdate.publishedAt = FieldValue.delete();
    }

    // Update course in transaction (to ensure consistency with modules)
    await adminDb.runTransaction(async (transaction) => {
      // Update course document
      transaction.set(
        adminDb!.collection(COL.courses).doc(parsed.courseId),
        courseUpdate,
        { merge: true }
      );

      // Update all modules in this course to match published status
      const modulesQuery = await adminDb!
        .collection(COL.modules)
        .where("courseId", "==", parsed.courseId)
        .get();

      modulesQuery.docs.forEach((moduleDoc) => {
        transaction.update(moduleDoc.ref, {
          published: parsed.published,
          updatedAt: now,
        });
      });
    });

    // Log admin action for audit trail
    await logAdminAction(adminDb, {
      actorUid: user.uid,
      action: parsed.published ? "course.publish" : "course.unpublish",
      resourceType: "course",
      resourceId: parsed.courseId,
      changes: {
        published: { before: courseData?.published, after: parsed.published },
      },
    });

    return Response.json({
      ok: true,
      courseId: parsed.courseId,
      published: parsed.published,
      modulesUpdated: (
        await adminDb
          .collection(COL.modules)
          .where("courseId", "==", parsed.courseId)
          .get()
      ).size,
    });
  } catch (error) {
    console.error("Course publish error:", error);
    return jsonError(error);
  }
}
