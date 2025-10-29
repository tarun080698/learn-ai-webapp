import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getUserFromRequest } from "@/lib/auth";
import { COL, enrollmentId } from "@/lib/firestore";

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

    // Query published AND non-archived courses using composite index
    // Index: (published, archived, publishedAt desc)
    const coursesRef = adminDb.collection(COL.courses);
    const publishedCoursesSnapshot = await coursesRef
      .where("published", "==", true)
      .where("archived", "==", false)
      .orderBy("publishedAt", "desc")
      .get();

    // Map courses with proper timestamp conversion
    let courses = publishedCoursesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore timestamps for JSON serialization
      createdAt:
        doc.data().createdAt?.toDate()?.toISOString() ||
        new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate()?.toISOString(),
      publishedAt: doc.data().publishedAt?.toDate()?.toISOString(),
    }));

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
