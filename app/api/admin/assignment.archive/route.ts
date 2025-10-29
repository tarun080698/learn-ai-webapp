import { NextRequest } from "next/server";
import { getUserFromRequest, requireAdmin, jsonError } from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { zAssignmentArchive } from "@/lib/schemas";
import {
  updateArchiveStatus,
  requireQuestionnaireOwnership,
  COL,
} from "@/lib/firestore";

/*
DEV TESTING:
curl -X POST http://localhost:3000/api/admin/assignment.archive \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assignmentId": "assignment-123",
    "archived": true
  }'
*/

export async function POST(req: NextRequest) {
  try {
    // Verify admin authorization
    const user = await getUserFromRequest(req);
    requireAdmin(user);

    // Parse and validate request body
    const body = await req.json();
    const parsed = zAssignmentArchive.parse(body);

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

    // Update archive status with audit trail
    await updateArchiveStatus(
      adminDb,
      COL.assignments,
      parsed.assignmentId,
      parsed.archived,
      user.uid
    );

    return Response.json({
      ok: true,
      assignmentId: parsed.assignmentId,
      archived: parsed.archived,
      message: parsed.archived
        ? "Assignment archived successfully"
        : "Assignment unarchived successfully",
    });
  } catch (error) {
    console.error("Assignment archive error:", error);
    return jsonError(error);
  }
}
