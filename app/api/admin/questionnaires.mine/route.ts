/**
 * GET /api/admin/questionnaires.mine
 *
 * Admin lists only their own questionnaire templates with filtering options.
 *
 * Query parameters:
 * - purpose: string - filter by purpose ('survey', 'quiz', 'assessment')
 * - limit: number - max results (default 50)
 * - orderBy: string - 'updatedAt', 'createdAt', or 'title' (default 'updatedAt')
 * - orderDirection: string - 'asc' or 'desc' (default 'desc')
 *
 * curl -X GET "http://localhost:3000/api/admin/questionnaires.mine?purpose=survey&limit=10" \
 *   -H "Authorization: Bearer $ADMIN_TOKEN"
 */
import { NextRequest } from "next/server";
import { getUserFromRequest, requireAdmin, jsonError } from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { COL } from "@/lib/firestore";
import { QuestionnaireDoc } from "@/types/models";

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
    const purpose = searchParams.get("purpose");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const orderBy = searchParams.get("orderBy") || "updatedAt";
    const orderDirection = searchParams.get("orderDirection") || "desc";

    // Build query with ownership filter
    let query = adminDb
      .collection(COL.questionnaires)
      .where("ownerUid", "==", user.uid);

    // Add purpose filter if specified
    if (purpose && ["survey", "quiz", "assessment"].includes(purpose)) {
      query = query.where("purpose", "==", purpose);
    }

    // For development: fetch without ordering to avoid index requirements
    const snapshot = await query.get();

    let questionnaires: (QuestionnaireDoc & { id: string })[] =
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as QuestionnaireDoc),
      }));

    // Sort in JavaScript to avoid needing Firestore indexes
    questionnaires = questionnaires
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
      questionnaires,
      count: questionnaires.length,
      filters: {
        purpose: purpose || undefined,
        limit,
        orderBy,
        orderDirection,
      },
    });
  } catch (error) {
    console.error("Questionnaires.mine error:", error);
    return jsonError(error);
  }
}
