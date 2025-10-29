/**
 * GET /api/admin/modules.mine
 *
 * Admin lists only their own modules with filtering options.
 *
 * Query parameters:
 * - courseId: string - filter by specific course
 * - published: boolean - filter by published status
 * - limit: number - max results (default 50)
 * - orderBy: string - 'updatedAt', 'createdAt', or 'index' (default 'index')
 * - orderDirection: string - 'asc' or 'desc' (default 'asc' for index, 'desc' for dates)
 *
 * curl -X GET "http://localhost:3000/api/admin/modules.mine?courseId=course123&published=true" \
 *   -H "Authorization: Bearer $ADMIN_TOKEN"
 */
import { NextRequest } from "next/server";
import { getUserFromRequest, requireAdmin, jsonError } from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { COL } from "@/lib/firestore";
import { ModuleDoc } from "@/types/models";

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
    const courseId = searchParams.get("courseId");
    const published = searchParams.get("published");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const orderBy = searchParams.get("orderBy") || "index";
    const orderDirection =
      searchParams.get("orderDirection") ||
      (orderBy === "index" ? "asc" : "desc");

    // Build query with ownership filter
    let query = adminDb
      .collection(COL.modules)
      .where("ownerUid", "==", user.uid);

    // Add courseId filter if specified
    if (courseId) {
      query = query.where("courseId", "==", courseId);
    }

    // Add published filter if specified
    if (published !== null) {
      query = query.where("published", "==", published === "true");
    }

    // For development: fetch without ordering to avoid index requirements
    const snapshot = await query.get();

    let modules: (ModuleDoc & { id: string })[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as ModuleDoc),
    }));

    // Sort in JavaScript to avoid needing Firestore indexes
    modules = modules
      .sort((a, b) => {
        if (orderBy === "index") {
          return orderDirection === "desc"
            ? b.index - a.index
            : a.index - b.index;
        }

        // ModuleDoc only has updatedAt field
        const aValue = a.updatedAt.toDate().getTime();
        const bValue = b.updatedAt.toDate().getTime();

        if (orderDirection === "desc") {
          return bValue - aValue;
        }
        return aValue - bValue;
      })
      .slice(0, limit);

    return Response.json({
      ok: true,
      modules,
      count: modules.length,
      filters: {
        courseId: courseId || undefined,
        published: published === null ? undefined : published === "true",
        limit,
        orderBy,
        orderDirection,
      },
    });
  } catch (error) {
    console.error("Modules.mine error:", error);
    return jsonError(error);
  }
}
