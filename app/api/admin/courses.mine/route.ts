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
    console.log({ query });

    // Add archived filter (include non-archived and documents without archived field)
    // Note: We'll filter archived courses in memory since Firestore doesn't handle != null well with compound queries

    // Add published filter if specified
    if (published !== null) {
      console.log(`Filtering by published: ${published === "true"}`);
      query = query.where("published", "==", published === "true");
    }

    // Remove orderBy to avoid requiring composite index
    // We'll sort in memory after fetching
    query = query.limit(limit);

    const snapshot = await query.get();
    console.log(
      `Found ${snapshot.docs.length} total courses for user ${user.uid}`
    );

    const allCourses: (CourseDoc & { id: string })[] = snapshot.docs.map(
      (doc) => {
        const data = doc.data() as CourseDoc;
        console.log(`Course ${doc.id}:`, {
          title: data.title,
          published: data.published,
          archived: data.archived,
          ownerUid: data.ownerUid,
        });
        return {
          id: doc.id,
          ...data,
        };
      }
    );

    // Filter out archived courses (including handling undefined archived field)
    const filteredCourses = allCourses.filter(
      (course) => course.archived !== true
    );

    // Sort courses in memory by updatedAt
    filteredCourses.sort((a, b) => {
      // Handle Firestore Timestamp or regular date/string
      const aTime = a.updatedAt?.toDate ? a.updatedAt.toDate() : new Date(0);
      const bTime = b.updatedAt?.toDate ? b.updatedAt.toDate() : new Date(0);

      if (orderDirection === "asc") {
        return aTime.getTime() - bTime.getTime();
      } else {
        return bTime.getTime() - aTime.getTime();
      }
    });

    // Apply limit after sorting
    const courses = filteredCourses.slice(0, limit);

    console.log(`After filtering archived: ${filteredCourses.length} courses`);
    console.log(`After limit: ${courses.length} courses`);
    console.log(
      "Final courses:",
      courses.map((c) => ({
        id: c.id,
        title: c.title,
        published: c.published,
        archived: c.archived,
      }))
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
