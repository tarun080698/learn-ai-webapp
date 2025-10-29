import { NextRequest } from "next/server";
import { getUserFromRequest, requireAdmin, jsonError } from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { zAssignmentUpdate } from "@/lib/schemas";
import { requireQuestionnaireOwnership, COL } from "@/lib/firestore";

/*
DEV TESTING:
curl -X POST http://localhost:3000/api/admin/assignment.update \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assignmentId": "assignment-123",
    "scope": {
      "type": "module",
      "courseId": "course-123",
      "moduleId": "module-456"
    },
    "timing": "post",
    "active": true
  }'
*/

export async function POST(req: NextRequest) {
  try {
    // Verify admin authorization
    const user = await getUserFromRequest(req);
    requireAdmin(user);

    // Parse and validate request body
    const body = await req.json();
    const parsed = zAssignmentUpdate.parse(body);

    if (!adminDb) {
      throw Object.assign(new Error("Firebase Admin not initialized"), {
        status: 500,
      });
    }

    // Verify assignment exists
    const assignmentDoc = await adminDb
      .collection(COL.assignments)
      .doc(parsed.assignmentId)
      .get();
    if (!assignmentDoc.exists) {
      throw Object.assign(new Error("Assignment not found"), {
        status: 404,
        code: "assignment_not_found",
      });
    }

    const assignmentData = assignmentDoc.data();
    if (!assignmentData) {
      throw Object.assign(new Error("Assignment has no data"), {
        status: 500,
        code: "assignment_no_data",
      });
    }

    // Verify questionnaire ownership
    await requireQuestionnaireOwnership(
      adminDb,
      user.uid,
      assignmentData.questionnaireId
    );

    // If updating scope, verify within same course only
    if (parsed.scope) {
      const currentScope = assignmentData.scope;
      if (currentScope.courseId !== parsed.scope.courseId) {
        throw Object.assign(
          new Error("Cannot move assignment to different course"),
          {
            status: 400,
            code: "assignment_course_change_denied",
          }
        );
      }

      // If module-scoped, verify module exists and belongs to course
      if (parsed.scope.type === "module" && parsed.scope.moduleId) {
        const moduleDoc = await adminDb
          .collection(COL.modules)
          .doc(parsed.scope.moduleId)
          .get();
        if (!moduleDoc.exists) {
          throw Object.assign(new Error("Module not found"), {
            status: 404,
            code: "module_not_found",
          });
        }

        const moduleData = moduleDoc.data();
        if (moduleData?.courseId !== parsed.scope.courseId) {
          throw Object.assign(
            new Error("Module does not belong to the specified course"),
            {
              status: 400,
              code: "module_course_mismatch",
            }
          );
        }
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (parsed.scope) {
      updateData.scope = parsed.scope;
    }

    if (parsed.timing) {
      updateData.timing = parsed.timing;
    }

    if (typeof parsed.active === "boolean") {
      updateData.active = parsed.active;
    }

    // Update assignment
    await assignmentDoc.ref.update(updateData);

    return Response.json({
      ok: true,
      assignmentId: parsed.assignmentId,
      updated: Object.keys(updateData).filter((key) => key !== "updatedAt"),
      message: "Assignment updated successfully",
    });
  } catch (error) {
    console.error("Assignment update error:", error);
    return jsonError(error);
  }
}
