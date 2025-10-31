import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getUserFromRequest } from "@/lib/auth";
import { COL, enrollmentId } from "@/lib/firestore";
import { formatDateISO } from "@/utils/dateUtils";

/**
 * GET /api/catalog-temp
 * Temporary catalog endpoint without orderBy to work while index builds
 */
export async function GET(req: NextRequest) {
  try {
    console.log("📚 Fetching published courses for catalog (temp version)");

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

    // Query published courses without orderBy (while index is building)
    const coursesRef = adminDb.collection(COL.courses);
    const publishedCoursesSnapshot = await coursesRef
      .where("published", "==", true)
      .get();

    // Filter out archived courses and sort in memory
    const filteredCourses = publishedCoursesSnapshot.docs
      .filter((doc) => {
        const data = doc.data();
        return data.archived !== true; // Include if archived is false, undefined, or null
      })
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamps for JSON serialization
        createdAt:
          formatDateISO(doc.data().createdAt) || new Date().toISOString(),
        updatedAt: formatDateISO(doc.data().updatedAt),
        publishedAt: formatDateISO(doc.data().publishedAt),
      }))
      .sort((a, b) => {
        // Sort by publishedAt descending (newest first)
        const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return bTime - aTime;
      });

    let courses = filteredCourses;

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
