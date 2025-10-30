import { NextRequest } from "next/server";
import { getUserFromRequest, requireAdmin, jsonError } from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { zCourseUpsert } from "@/lib/schemas";
import { COL } from "@/lib/firestore";
import { logAdminAction, trackChanges } from "@/lib/adminAudit";

/*
DEV TESTING:
curl -X POST http://localhost:3000/api/admin/course.upsert \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Introduction to Machine Learning",
    "description": "Learn the fundamentals of ML with hands-on examples",
    "durationMinutes": 240,
    "level": "beginner",
    "heroImageUrl": "https://example.com/image.jpg"
  }'

UPDATE EXISTING:
curl -X POST http://localhost:3000/api/admin/course.upsert \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "existing-course-id",
    "title": "Updated Course Title",
    "description": "Updated description",
    "durationMinutes": 300,
    "level": "intermediate"
  }'
*/

export async function POST(req: NextRequest) {
  try {
    // Verify admin authorization
    const user = await getUserFromRequest(req);
    requireAdmin(user);

    // Parse and validate request body
    const body = await req.json();
    const parsed = zCourseUpsert.parse(body);

    if (!adminDb) {
      throw Object.assign(new Error("Firebase Admin not initialized"), {
        status: 500,
      });
    }

    const now = new Date();
    let courseId: string;
    let isUpdate = false;

    if (parsed.courseId) {
      // Update existing course
      courseId = parsed.courseId;
      isUpdate = true;

      // Verify course exists and admin owns it
      const courseDoc = await adminDb
        .collection(COL.courses)
        .doc(courseId)
        .get();
      if (!courseDoc.exists) {
        throw Object.assign(new Error("Course not found"), {
          status: 404,
          code: "course_not_found",
        });
      }

      // Verify ownership
      const courseData = courseDoc.data();
      if (courseData?.ownerUid !== user.uid) {
        throw Object.assign(new Error("Access denied: not the course owner"), {
          status: 403,
          code: "course_access_denied",
        });
      }
    } else {
      // Create new course
      courseId = adminDb.collection(COL.courses).doc().id;
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      ownerUid: user.uid, // Always set/ensure owner
      title: parsed.title,
      description: parsed.description,
      durationMinutes: parsed.durationMinutes,
      level: parsed.level,
      updatedAt: now,
    };

    // Add optional fields
    if (parsed.heroImageUrl !== undefined) {
      updateData.heroImageUrl = parsed.heroImageUrl;
    }

    let auditChanges;
    if (isUpdate) {
      // Get current data for change tracking
      const currentDoc = await adminDb
        .collection(COL.courses)
        .doc(courseId)
        .get();
      const currentData = currentDoc.data()!;

      // Update existing course (preserve existing fields)
      await adminDb
        .collection(COL.courses)
        .doc(courseId)
        .set(updateData, { merge: true });

      // Track changes for audit
      auditChanges = trackChanges(
        currentData,
        { ...currentData, ...updateData },
        ["title", "description", "durationMinutes", "level", "heroImageUrl"]
      );
    } else {
      // Create new course with defaults
      updateData.published = false;
      updateData.moduleCount = 0;
      updateData.createdAt = now;
      await adminDb.collection(COL.courses).doc(courseId).set(updateData);
    }

    // Log admin action for audit trail
    await logAdminAction(adminDb, {
      actorUid: user.uid,
      action: isUpdate ? "course.update" : "course.create",
      resourceType: "course",
      resourceId: courseId,
      ...(auditChanges && { changes: auditChanges }),
    });

    return Response.json({
      ok: true,
      id: courseId,
      isUpdate,
    });
  } catch (error) {
    console.error("Course upsert error:", error);
    return jsonError(error);
  }
}
