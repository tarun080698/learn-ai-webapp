/**
 * GET /api/admin/assignments.mine
 *
 * Admin lists only their own questionnaire assignments with filtering options.
 *
 * Query parameters:
 * - questionnaireId: string - filter by questionnaire
 * - courseId: string - filter by course (for course-scoped assignments)
 * - moduleId: string - filter by module (for module-scoped assignments)
 * - timing: string - filter by timing ('pre', 'post')
 * - active: boolean - filter by active status
 * - limit: number - max results (default 50)
 * - orderBy: string - 'updatedAt' or 'createdAt' (default 'updatedAt')
 * - orderDirection: string - 'asc' or 'desc' (default 'desc')
 *
 * curl -X GET "http://localhost:3000/api/admin/assignments.mine?courseId=course123&active=true" \
 *   -H "Authorization: Bearer $ADMIN_TOKEN"
 */
import { NextRequest } from "next/server";
import { getUserFromRequest, requireAdmin, jsonError } from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { COL } from "@/lib/firestore";
import { QuestionnaireAssignmentDoc } from "@/types/models";

export async function GET(req: NextRequest) {
  try {
    // Verify admin authorization
    const user = await getUserFromRequest(req);
    requireAdmin(user);

    if (!adminDb) {
      throw Object.assign(new Error("Firebase Admin not initialized"), {
        status: 500,
      });
    }

    const { searchParams } = new URL(req.url);
    const questionnaireId = searchParams.get("questionnaireId");
    const courseId = searchParams.get("courseId");
    const moduleId = searchParams.get("moduleId");
    const timing = searchParams.get("timing");
    const active = searchParams.get("active");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const orderBy = searchParams.get("orderBy") || "updatedAt";
    const orderDirection = searchParams.get("orderDirection") || "desc";

    // Build query with ownership filter
    let query = adminDb
      .collection(COL.assignments)
      .where("ownerUid", "==", user.uid);

    // Add filters based on query parameters
    if (questionnaireId) {
      query = query.where("questionnaireId", "==", questionnaireId);
    }

    if (courseId) {
      query = query.where("scope.courseId", "==", courseId);
    }

    if (moduleId) {
      query = query.where("scope.moduleId", "==", moduleId);
    }

    if (timing && ["pre", "post"].includes(timing)) {
      query = query.where("timing", "==", timing);
    }

    if (active !== null) {
      query = query.where("active", "==", active === "true");
    }

    // For development: fetch without ordering to avoid index requirements
    const snapshot = await query.get();

    let assignments: (QuestionnaireAssignmentDoc & { id: string })[] =
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as QuestionnaireAssignmentDoc),
      }));

    // Sort in JavaScript to avoid needing Firestore indexes
    assignments = assignments
      .sort((a, b) => {
        const aValue =
          orderBy === "updatedAt"
            ? a.updatedAt.toDate().getTime()
            : a.createdAt.toDate().getTime();
        const bValue =
          orderBy === "updatedAt"
            ? b.updatedAt.toDate().getTime()
            : b.createdAt.toDate().getTime();

        if (orderDirection === "desc") {
          return bValue - aValue;
        }
        return aValue - bValue;
      })
      .slice(0, limit);

    return Response.json({
      ok: true,
      assignments,
      count: assignments.length,
      filters: {
        questionnaireId: questionnaireId || undefined,
        courseId: courseId || undefined,
        moduleId: moduleId || undefined,
        timing: timing || undefined,
        active: active === null ? undefined : active === "true",
        limit,
        orderBy,
        orderDirection,
      },
    });
  } catch (error) {
    console.error("Assignments.mine error:", error);
    return jsonError(error);
  }
}
