/**
 * POST /api/admin/assignment.upsert
 *
 * Admin creates or updates questionnaire assignments (attaching questionnaires to courses/modules).
 *
 * curl -X POST http://localhost:3000/api/admin/assignment.upsert \
 *   -H "Authorization: Bearer $ADMIN_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "questionnaireId": "questionnaire_id_here",
 *     "scope": {
 *       "type": "course",
 *       "courseId": "course_id_here"
 *     },
 *     "timing": "pre",
 *     "active": true
 *   }'
 */
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, requireAdmin, jsonError } from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { COL } from "@/lib/firestore";
import { zAssignmentUpsert } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const validated = zAssignmentUpsert.parse(body);

    // Require admin authentication
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    try {
      requireAdmin(user);
    } catch {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    if (!adminDb) {
      throw new Error("Firebase Admin not initialized");
    }

    const now = new Date();
    const assignmentId =
      validated.assignmentId || adminDb.collection(COL.assignments).doc().id;

    // Get questionnaire to freeze version and verify ownership
    const questionnaireDoc = await adminDb
      .collection(COL.questionnaires)
      .doc(validated.questionnaireId)
      .get();
    if (!questionnaireDoc.exists) {
      return NextResponse.json(
        { error: "Questionnaire not found" },
        { status: 404 }
      );
    }

    const questionnaire = questionnaireDoc.data();
    if (!questionnaire) {
      return NextResponse.json(
        { error: "Questionnaire has no data" },
        { status: 404 }
      );
    }

    // Verify questionnaire ownership
    if (questionnaire.ownerUid !== user.uid) {
      throw Object.assign(
        new Error("Access denied: not the questionnaire owner"),
        {
          status: 403,
          code: "questionnaire_access_denied",
        }
      );
    }

    // Verify scope ownership (course or module)
    if (validated.scope.type === "course") {
      const courseDoc = await adminDb
        .collection(COL.courses)
        .doc(validated.scope.courseId)
        .get();
      if (!courseDoc.exists) {
        return NextResponse.json(
          { error: "Course not found" },
          { status: 404 }
        );
      }
      const courseData = courseDoc.data();
      if (courseData?.ownerUid !== user.uid) {
        throw Object.assign(new Error("Access denied: not the course owner"), {
          status: 403,
          code: "course_access_denied",
        });
      }
    } else if (validated.scope.type === "module" && validated.scope.moduleId) {
      const moduleDoc = await adminDb
        .collection(COL.modules)
        .doc(validated.scope.moduleId)
        .get();
      if (!moduleDoc.exists) {
        return NextResponse.json(
          { error: "Module not found" },
          { status: 404 }
        );
      }
      const moduleData = moduleDoc.data();
      if (moduleData?.ownerUid !== user.uid) {
        throw Object.assign(new Error("Access denied: not the module owner"), {
          status: 403,
          code: "module_access_denied",
        });
      }
    }

    // If updating existing assignment, verify ownership
    if (validated.assignmentId) {
      const existingDoc = await adminDb
        .collection(COL.assignments)
        .doc(validated.assignmentId)
        .get();
      if (existingDoc.exists) {
        const existing = existingDoc.data();
        if (existing?.ownerUid !== user.uid) {
          throw Object.assign(
            new Error("Access denied: not the assignment owner"),
            {
              status: 403,
              code: "assignment_access_denied",
            }
          );
        }
      }
    }

    const assignmentData = {
      questionnaireId: validated.questionnaireId,
      questionnaireVersion: questionnaire.version, // Freeze version
      scope: validated.scope,
      timing: validated.timing,
      active: validated.active ?? true,
      ownerUid: user.uid, // Set ownership
      updatedAt: now,
      ...(validated.assignmentId ? {} : { createdAt: now }),
    };

    await adminDb
      .collection(COL.assignments)
      .doc(assignmentId)
      .set(assignmentData, { merge: !!validated.assignmentId });

    console.log(
      `✅ ${
        validated.assignmentId ? "Updated" : "Created"
      } assignment: ${assignmentId}`
    );

    return NextResponse.json({
      ok: true,
      assignmentId,
    });
  } catch (error) {
    return jsonError(error);
  }
}
