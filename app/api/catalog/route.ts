import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * GET /api/catalog
 *
 * Returns published courses for public catalog display.
 * No authentication required - public endpoint.
 */
export async function GET() {
  try {
    console.log("📚 Fetching published courses for catalog");

    if (!adminDb) {
      throw new Error("Firebase Admin not initialized");
    }

    // Query published courses from Firestore
    // Note: Using simple query for development, orderBy handled in JavaScript
    // For production, create composite index: published + createdAt
    const coursesRef = adminDb.collection("courses");
    const publishedCoursesSnapshot = await coursesRef
      .where("published", "==", true)
      .get();

    // Sort in JavaScript for development compatibility
    const courses = publishedCoursesSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamps for JSON serialization
        createdAt:
          doc.data().createdAt?.toDate()?.toISOString() ||
          new Date().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate()?.toISOString(),
        publishedAt: doc.data().publishedAt?.toDate()?.toISOString(),
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    console.log(`✅ Found ${courses.length} published courses`);

    return NextResponse.json(
      {
        success: true,
        courses,
        count: courses.length,
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
