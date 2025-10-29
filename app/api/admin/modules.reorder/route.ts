import { NextRequest } from "next/server";
import { getUserFromRequest, requireAdmin, jsonError } from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { zModulesReorder } from "@/lib/schemas";
import { requireCourseOwnership, COL } from "@/lib/firestore";

/*
DEV TESTING:
curl -X POST http://localhost:3000/api/admin/modules.reorder \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "course-123",
    "order": [
      {"moduleId": "module-1", "index": 0},
      {"moduleId": "module-3", "index": 1},
      {"moduleId": "module-2", "index": 2}
    ]
  }'
*/

export async function POST(req: NextRequest) {
  try {
    // Verify admin authorization
    const user = await getUserFromRequest(req);
    requireAdmin(user);

    // Parse and validate request body
    const body = await req.json();
    const parsed = zModulesReorder.parse(body);

    if (!adminDb) {
      throw Object.assign(new Error("Firebase Admin not initialized"), {
        status: 500,
      });
    }

    // Verify course ownership
    await requireCourseOwnership(adminDb, user.uid, parsed.courseId);

    // Update module order using batch operation
    const batch = adminDb.batch();
    const now = new Date();

    for (const item of parsed.order) {
      const moduleRef = adminDb.collection(COL.modules).doc(item.moduleId);

      // Verify module belongs to the course
      const moduleDoc = await moduleRef.get();
      if (!moduleDoc.exists) {
        throw Object.assign(new Error(`Module ${item.moduleId} not found`), {
          status: 404,
          code: "module_not_found",
        });
      }

      const moduleData = moduleDoc.data();
      if (moduleData?.courseId !== parsed.courseId) {
        throw Object.assign(
          new Error(
            `Module ${item.moduleId} does not belong to course ${parsed.courseId}`
          ),
          {
            status: 400,
            code: "module_course_mismatch",
          }
        );
      }

      // Update the module's index
      batch.update(moduleRef, {
        index: item.index,
        updatedAt: now,
      });
    }

    await batch.commit();

    return Response.json({
      ok: true,
      courseId: parsed.courseId,
      reorderedCount: parsed.order.length,
      message: "Modules reordered successfully",
    });
  } catch (error) {
    console.error("Modules reorder error:", error);
    return jsonError(error);
  }
}
