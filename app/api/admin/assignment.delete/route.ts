import { NextRequest } from "next/server";
import { getUserFromRequest, requireAdmin, jsonError } from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { zAssignmentDelete } from "@/lib/schemas";
import { requireQuestionnaireOwnership, COL } from "@/lib/firestore";

/*
DEV TESTING:
curl -X POST http://localhost:3000/api/admin/assignment.delete \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assignmentId": "assignment-123"
  }'
*/

export async function POST(req: NextRequest) {
  try {
    // Verify admin authorization
    const user = await getUserFromRequest(req);
    requireAdmin(user);

    // Parse and validate request body
    const body = await req.json();
    const parsed = zAssignmentDelete.parse(body);

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

    // Check if there are any responses to this assignment
    const responsesQuery = adminDb
      .collection(COL.responses)
      .where("assignmentId", "==", parsed.assignmentId)
      .limit(1);

    const responsesSnapshot = await responsesQuery.get();

    if (!responsesSnapshot.empty) {
      throw Object.assign(
        new Error(
          "Cannot delete assignment with existing responses. Archive it instead."
        ),
        {
          status: 400,
          code: "assignment_has_responses",
        }
      );
    }

    // Create audit log before deletion
    const auditLog = {
      action: "delete",
      collection: COL.assignments,
      docId: parsed.assignmentId,
      adminUid: user.uid,
      reason: "Admin delete via API",
      timestamp: new Date(),
      assignmentData: {
        questionnaireId: assignmentData.questionnaireId,
        scope: assignmentData.scope,
        timing: assignmentData.timing,
      },
    };

    // In a real app, you'd store this in an audit collection
    console.log("Assignment Delete Audit Log:", auditLog);

    // Perform the hard delete
    await assignmentDoc.ref.delete();

    return Response.json({
      ok: true,
      assignmentId: parsed.assignmentId,
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    console.error("Assignment delete error:", error);
    return jsonError(error);
  }
}
