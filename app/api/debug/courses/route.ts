import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

interface CourseDoc {
  id: string;
  title?: string;
  published?: boolean;
  archived?: boolean;
  publishedAt?: unknown;
  [key: string]: unknown;
}

/**
 * GET /api/debug/courses
 * Debug endpoint to check courses in database
 */
export async function GET() {
  try {
    console.log("🔍 Debug: Checking courses collection...");

    if (!adminDb) {
      throw new Error("Firebase Admin not initialized");
    }

    // Check all courses
    const allCoursesSnapshot = await adminDb
      .collection("courses")
      .limit(10)
      .get();
    const allCourses: CourseDoc[] = allCoursesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Check published courses only
    let publishedCourses: CourseDoc[] = [];
    try {
      const publishedSnapshot = await adminDb
        .collection("courses")
        .where("published", "==", true)
        .get();
      publishedCourses = publishedSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error querying published courses:", error);
    }

    // Check non-archived courses
    let nonArchivedCourses: CourseDoc[] = [];
    try {
      const nonArchivedSnapshot = await adminDb
        .collection("courses")
        .where("archived", "==", false)
        .get();
      nonArchivedCourses = nonArchivedSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error querying non-archived courses:", error);
    }

    // Try compound query without orderBy
    let compoundCourses: CourseDoc[] = [];
    try {
      const compoundSnapshot = await adminDb
        .collection("courses")
        .where("published", "==", true)
        .where("archived", "==", false)
        .get();
      compoundCourses = compoundSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error querying compound courses:", error);
    }

    return NextResponse.json({
      debug: true,
      totalCourses: allCourses.length,
      publishedCourses: publishedCourses.length,
      nonArchivedCourses: nonArchivedCourses.length,
      compoundCourses: compoundCourses.length,
      allCourses: allCourses.map((course) => ({
        id: course.id,
        title: course.title,
        published: course.published,
        archived: course.archived,
        publishedAt: course.publishedAt,
      })),
      publishedList: publishedCourses.map((course) => ({
        id: course.id,
        title: course.title,
        published: course.published,
        archived: course.archived,
        publishedAt: course.publishedAt,
      })),
      compoundList: compoundCourses,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Debug error:", error);
    return NextResponse.json(
      { error: "Debug failed", details: errorMessage },
      { status: 500 }
    );
  }
}
