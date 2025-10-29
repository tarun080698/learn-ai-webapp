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

    // Add published filter if specified
    if (published !== null) {
      query = query.where("published", "==", published === "true");
    }

    // For development: fetch without ordering to avoid index requirements
    const snapshot = await query.get();

    let courses: (CourseDoc & { id: string })[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as CourseDoc),
    }));

    // Sort in JavaScript to avoid needing Firestore indexes
    courses = courses
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
