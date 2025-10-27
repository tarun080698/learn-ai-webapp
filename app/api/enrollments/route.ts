import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

/**
 * GET /api/enrollments
 *
 * Returns user's enrollments with course details and progress.
 * Requires authentication.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth!.verifyIdToken(token);
    const uid = decodedToken.uid;

    console.log(`📚 Fetching enrollments for user: ${uid}`);

    if (!adminDb) {
      throw new Error("Firebase Admin not initialized");
    }

    // Get user's enrollments
    const enrollmentsRef = adminDb.collection("enrollments");
    const userEnrollmentsSnapshot = await enrollmentsRef
      .where("uid", "==", uid)
      .orderBy("enrolledAt", "desc")
      .get();

    if (userEnrollmentsSnapshot.empty) {
      return NextResponse.json({
        success: true,
        enrollments: [],
        count: 0,
      });
    }

    // Get course details for each enrollment
    const enrollments = [];
    for (const enrollmentDoc of userEnrollmentsSnapshot.docs) {
      const enrollmentData = enrollmentDoc.data();

      // Fetch course details
      const courseDoc = await adminDb
        .collection("courses")
        .doc(enrollmentData.courseId)
        .get();
      if (courseDoc.exists) {
        const courseData = courseDoc.data();

        enrollments.push({
          id: enrollmentDoc.id,
          courseId: enrollmentData.courseId,
          enrolledAt: enrollmentData.enrolledAt?.toDate()?.toISOString(),
          completed: enrollmentData.completed || false,
          lastModuleIndex: enrollmentData.lastModuleIndex || 0,
          completedCount: enrollmentData.completedCount || 0,
          progressPct: enrollmentData.progressPct || 0,
          course: {
            id: courseDoc.id,
            title: courseData?.title || "Untitled Course",
            description: courseData?.description || "",
            moduleCount: courseData?.moduleCount || 0,
            durationMinutes: courseData?.durationMinutes || 0,
            level: courseData?.level || "beginner",
            published: courseData?.published || false,
          },
        });
      }
    }

    console.log(`✅ Found ${enrollments.length} enrollments for user`);

    return NextResponse.json({
      success: true,
      enrollments,
      count: enrollments.length,
    });
  } catch (error) {
    console.error("❌ Error fetching enrollments:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
      { status: 500 }
    );
  }
}
