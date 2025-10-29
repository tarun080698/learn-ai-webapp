import { NextRequest } from "next/server";
import { getUserFromRequest, requireAdmin, jsonError } from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { zCourseArchive } from "@/lib/schemas";
import { updateArchiveStatus, requireCourseOwnership } from "@/lib/firestore";

/*
DEV TESTING:
curl -X POST http://localhost:3000/api/admin/course.archive \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "course-123",
    "archived": true
  }'

UNARCHIVE:
curl -X POST http://localhost:3000/api/admin/course.archive \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "course-123",
    "archived": false
  }'
*/

export async function POST(req: NextRequest) {
  try {
    // Verify admin authorization
    const user = await getUserFromRequest(req);
    requireAdmin(user);

    // Parse and validate request body
    const body = await req.json();
    const parsed = zCourseArchive.parse(body);

    if (!adminDb) {
      throw Object.assign(new Error("Firebase Admin not initialized"), {
        status: 500,
      });
    }

    // Verify course ownership
    await requireCourseOwnership(adminDb, user.uid, parsed.courseId);

    // Update archive status with audit trail
    await updateArchiveStatus(
      adminDb,
      "courses",
      parsed.courseId,
      parsed.archived,
      user.uid
    );

    return Response.json({
      ok: true,
      courseId: parsed.courseId,
      archived: parsed.archived,
      message: parsed.archived
        ? "Course archived successfully"
        : "Course unarchived successfully",
    });
  } catch (error) {
    console.error("Course archive error:", error);
    return jsonError(error);
  }
}
