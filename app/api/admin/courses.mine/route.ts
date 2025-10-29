/**
 * GET /api/admin/courses.mine
 *
 * Admin lists only their own courses with optional filtering.
 *
 * Query parameters:
 * - published: boolean - filter by published status
 * - limit: number - max results (default 50)
 * - orderBy: string - 'updatedAt' or 'createdAt' (default 'updatedAt')
 * - orderDirection: string - 'asc' or 'desc' (default 'desc')
 *
 * curl -X GET "http://localhost:3000/api/admin/courses.mine?published=true&limit=10" \
 *   -H "Authorization: Bearer $ADMIN_TOKEN"
 */
import { NextRequest } from "next/server";
import { getUserFromRequest, requireAdmin, jsonError } from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { COL } from "@/lib/firestore";
import { CourseDoc } from "@/types/models";

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
    const published = searchParams.get("published");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const orderBy = searchParams.get("orderBy") || "updatedAt";
    const orderDirection = searchParams.get("orderDirection") || "desc";

    // Build query with ownership filter
    let query = adminDb
      .collection(COL.courses)
      .where("ownerUid", "==", user.uid);

    // Add archived filter (always exclude archived)
    query = query.where("archived", "==", false);

    // Add published filter if specified
    if (published !== null) {
      query = query.where("published", "==", published === "true");
    }

    // Use composite index: (ownerUid, archived, updatedAt desc)
    // Only support updatedAt ordering to match available index
    query = query.orderBy("updatedAt", orderDirection as "asc" | "desc");
    query = query.limit(limit);

    const snapshot = await query.get();

    const courses: (CourseDoc & { id: string })[] = snapshot.docs.map(
      (doc) => ({
        id: doc.id,
        ...(doc.data() as CourseDoc),
      })
    );

    return Response.json({
      ok: true,
      courses,
      count: courses.length,
      filters: {
        published: published === null ? undefined : published === "true",
        limit,
        orderBy,
        orderDirection,
      },
    });
  } catch (error) {
    console.error("Courses.mine error:", error);
    return jsonError(error);
  }
}
