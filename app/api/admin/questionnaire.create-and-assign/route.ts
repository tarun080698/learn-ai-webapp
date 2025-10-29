import { NextRequest } from "next/server";
import { getUserFromRequest, requireAdmin, jsonError } from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { zQuestionnaireCreateAndAssign } from "@/lib/schemas";
import { requireCourseOwnership, COL } from "@/lib/firestore";

/*
DEV TESTING:
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
*/

export async function POST(req: NextRequest) {
  try {
    // Verify admin authorization
    const user = await getUserFromRequest(req);
    requireAdmin(user);

    // Parse and validate request body
    const body = await req.json();
    const parsed = zQuestionnaireCreateAndAssign.parse(body);

    if (!adminDb) {
      throw Object.assign(new Error("Firebase Admin not initialized"), {
        status: 500,
      });
    }

    // Verify course ownership
    await requireCourseOwnership(adminDb, user.uid, parsed.scope.courseId);

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

    const now = new Date();

    // 1. Create questionnaire
    const questionnaireId = adminDb.collection(COL.questionnaires).doc().id;
    const questionnaireData = {
      ownerUid: user.uid,
      title: parsed.title,
      purpose: parsed.purpose,
      questions: parsed.questions,
      version: 1,
      archived: false,
      archivedAt: null,
      archivedBy: null,
      createdAt: now,
      updatedAt: now,
    };

    await adminDb
      .collection(COL.questionnaires)
      .doc(questionnaireId)
      .set(questionnaireData);

    // 2. Create assignment
    const assignmentId = adminDb.collection(COL.assignments).doc().id;
    const assignmentData = {
      questionnaireId,
      questionnaireVersion: 1,
      scope: parsed.scope,
      timing: parsed.timing,
      active: true,
      archived: false,
      archivedAt: null,
      archivedBy: null,
      createdAt: now,
      updatedAt: now,
    };

    await adminDb
      .collection(COL.assignments)
      .doc(assignmentId)
      .set(assignmentData);

    return Response.json({
      ok: true,
      questionnaireId,
      assignmentId,
      scope: parsed.scope,
      timing: parsed.timing,
      message: "Questionnaire created and assigned successfully",
    });
  } catch (error) {
    console.error("Questionnaire create-and-assign error:", error);
    return jsonError(error);
  }
}
