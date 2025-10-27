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

    // Get questionnaire to freeze version
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

    const assignmentData = {
      questionnaireId: validated.questionnaireId,
      questionnaireVersion: questionnaire.version, // Freeze version
      scope: validated.scope,
      timing: validated.timing,
      active: validated.active ?? true,
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
