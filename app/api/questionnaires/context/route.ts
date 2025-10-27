/**
 * GET /api/questionnaires/context?courseId=X&moduleId=Y
 *
 * Returns questionnaire assignments and completion status for given context.
 *
 * curl -X GET "http://localhost:3000/api/questionnaires/context?courseId=course_id&moduleId=module_id" \
 *   -H "Authorization: Bearer $USER_TOKEN"
 */
import { NextRequest, NextResponse } from "next/server";
import {
  getUserFromRequest,
  assertUserProviderGoogle,
  jsonError,
} from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { COL, getAssignmentsForContext, responseId } from "@/lib/firestore";

export async function GET(req: NextRequest) {
  try {
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

    // Parse query parameters
    const url = new URL(req.url);
    const courseId = url.searchParams.get("courseId");
    const moduleId = url.searchParams.get("moduleId");

    if (!courseId) {
      return NextResponse.json(
        { error: "courseId is required" },
        { status: 422 }
      );
    }

    // Get assignments for this context
    const assignments = await getAssignmentsForContext(adminDb, {
      courseId,
      moduleId: moduleId || undefined,
    });

    // Check completion status for each assignment
    const result: {
      ok: boolean;
      preCourse?: { assignmentId: string; completed: boolean };
      postCourse?: { assignmentId: string; completed: boolean };
      preModule?: { assignmentId: string; completed: boolean };
      postModule?: { assignmentId: string; completed: boolean };
    } = { ok: true };

    for (const [key, assignment] of Object.entries(assignments)) {
      if (assignment) {
        const resId = responseId(user.uid, assignment.assignmentId);
        const responseDoc = await adminDb
          .collection(COL.responses)
          .doc(resId)
          .get();
        const completed =
          responseDoc.exists && responseDoc.data()?.isComplete === true;

        if (key === "preCourse") {
          result.preCourse = {
            assignmentId: assignment.assignmentId,
            completed,
          };
        } else if (key === "postCourse") {
          result.postCourse = {
            assignmentId: assignment.assignmentId,
            completed,
          };
        } else if (key === "preModule") {
          result.preModule = {
            assignmentId: assignment.assignmentId,
            completed,
          };
        } else if (key === "postModule") {
          result.postModule = {
            assignmentId: assignment.assignmentId,
            completed,
          };
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
