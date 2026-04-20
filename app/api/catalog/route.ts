import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getUserFromRequest } from "@/lib/auth";
import { COL, enrollmentId } from "@/lib/firestore";
import { formatDateISO } from "@/utils/dateUtils";

/**
 * GET /api/catalog
 *
 * Returns published and non-archived courses for public catalog display.
 * If Authorization header is present and valid, decorates with enrollment info.
 * Public endpoint - authentication optional.
 */
export async function GET(req: NextRequest) {
  try {
    console.log("📚 Fetching published courses for catalog");

    if (!adminDb) {
      throw new Error("Firebase Admin not initialized");
    }

    // Try to get authenticated user (optional for this endpoint)
    let user = null;
    try {
      user = await getUserFromRequest(req);
    } catch {
      // Ignore auth errors - this is a public endpoint
    }

    // Query published courses (no orderBy to avoid dropping docs missing publishedAt)
    const coursesRef = adminDb.collection(COL.courses);
    const publishedCoursesSnapshot = await coursesRef
      .where("published", "==", true)
      .get();

    // Filter out archived courses, normalize timestamps, then sort in memory.
    // Sort uses publishedAt desc, falling back to createdAt for legacy docs.
    let courses = publishedCoursesSnapshot.docs
      .filter((doc) => doc.data().archived !== true)
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt:
          formatDateISO(doc.data().createdAt) || new Date().toISOString(),
        updatedAt: formatDateISO(doc.data().updatedAt),
        publishedAt: formatDateISO(doc.data().publishedAt),
      }))
      .sort((a, b) => {
        const aTime = new Date(a.publishedAt || a.createdAt).getTime();
        const bTime = new Date(b.publishedAt || b.createdAt).getTime();
        return bTime - aTime;
      });

    // If user is authenticated, decorate with enrollment information
    if (user) {
      const enrollmentPromises = courses.map(async (course) => {
        const enrollId = enrollmentId(user.uid, course.id);
        const enrollDoc = await adminDb!
          .collection(COL.enrollments)
          .doc(enrollId)
          .get();

        if (enrollDoc.exists) {
          const enrollData = enrollDoc.data()!;
          return {
            ...course,
            enrolled: true,
            enrollmentId: enrollId,
            progressPct: enrollData.progressPct || 0,
            completed: enrollData.completed || false,
          };
        } else {
          return {
            ...course,
            enrolled: false,
            enrollmentId: null,
          };
        }
      });

      courses = await Promise.all(enrollmentPromises);
    }

    console.log(
      `✅ Found ${courses.length} published courses${
        user ? " (decorated with enrollment info)" : ""
      }`
    );

    return NextResponse.json(
      {
        success: true,
        courses,
        count: courses.length,
        authenticated: !!user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error fetching catalog:", error);
    return NextResponse.json(
      { error: "Failed to fetch course catalog" },
      { status: 500 }
    );
  }
}
