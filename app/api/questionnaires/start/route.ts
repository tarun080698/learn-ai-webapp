/**
 * POST /api/questionnaires/start
 *
 * User starts a questionnaire assignment and receives the frozen template for rendering.
 *
 * curl -X POST http://localhost:3000/api/questionnaires/start \
 *   -H "Authorization: Bearer $USER_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"assignmentId": "assignment_id_here"}'
 */
import { NextRequest, NextResponse } from "next/server";
import {
  getUserFromRequest,
  assertUserProviderGoogle,
  jsonError,
} from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { getAssignmentWithTemplate } from "@/lib/firestore";
import { zStart } from "@/lib/schemas";
import type {
  QuestionnaireDoc,
  QuestionnaireAssignmentDoc,
} from "@/types/models";

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const validated = zStart.parse(body);

    // Require user authentication (Google provider)
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    try {
      assertUserProviderGoogle(user);
    } catch {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    if (!adminDb) {
      throw new Error("Firebase Admin not initialized");
    }

    // Load assignment and template (with version verification)
    const { assignment, questionnaire } = await getAssignmentWithTemplate(
      adminDb,
      validated.assignmentId
    );

    // Type cast the data since firestore returns generic object
    const assignmentData = assignment as QuestionnaireAssignmentDoc & {
      id: string;
    };
    const questionnaireData = questionnaire as QuestionnaireDoc & {
      id: string;
    };

    // Ensure assignment is active
    if (!assignmentData.active) {
      return NextResponse.json(
        { error: "Assignment is not active" },
        { status: 409 }
      );
    }

    // Return frozen template payload for rendering
    return NextResponse.json({
      ok: true,
      assignmentId: validated.assignmentId,
      questionnaire: {
        title: questionnaireData.title,
        purpose: questionnaireData.purpose,
        version: questionnaireData.version,
        questions: questionnaireData.questions,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
