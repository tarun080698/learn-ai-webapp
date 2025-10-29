/**
 * GET /api/courses/[courseId]
 *
 * Fetch detailed information about a specific course including modules and questionnaires.
 * Public endpoint for course preview, but also includes enrollment status if user is authenticated.
 */
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;

    if (!adminDb) {
      throw new Error("Firebase Admin not initialized");
    }

    // Get course details
    const courseDoc = await adminDb.collection("courses").doc(courseId).get();

    if (!courseDoc.exists) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const courseData = courseDoc.data();

    // Only return published courses for non-admin users
    if (!courseData?.published) {
      return NextResponse.json(
        { error: "Course not available" },
        { status: 404 }
      );
    }

    // Get modules for this course from the correct collection
    // Note: Simplified query to avoid composite index requirement
    const modulesSnapshot = await adminDb
      .collection("courseModules")
      .where("courseId", "==", courseId)
      .get();

    console.log(
      `Found ${modulesSnapshot.docs.length} modules for course ${courseId}`
    );

    // Filter for published modules in JavaScript
    const allModules = modulesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(
      "All modules:",
      allModules.map((m: Record<string, unknown>) => ({
        id: m.id,
        published: m.published,
        title: m.title,
      }))
    );

    const publishedModules = allModules.filter(
      (module: Record<string, unknown>) => module.published === true
    );
    console.log(`Found ${publishedModules.length} published modules`);

    const modules = publishedModules.sort(
      (a: Record<string, unknown>, b: Record<string, unknown>) =>
        ((a.index as number) || 0) - ((b.index as number) || 0)
    );

    // Get course-level questionnaire assignments
    const assignmentsSnapshot = await adminDb
      .collection("assignments")
      .where("scope.courseId", "==", courseId)
      .where("scope.type", "==", "course")
      .where("active", "==", true)
      .get();

    const assignments = assignmentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get questionnaire details for assignments
    const questionnaireIds = assignments.map(
      (a: Record<string, unknown>) => a.questionnaireId as string
    );
    const questionnaires: Array<Record<string, unknown>> = [];

    if (questionnaireIds.length > 0) {
      const questionnairesSnapshot = await adminDb
        .collection("questionnaires")
        .where("__name__", "in", questionnaireIds)
        .get();

      questionnaires.push(
        ...questionnairesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    }

    // Check if user is enrolled (if authenticated)
    let enrollmentStatus = null;
    let enrollmentDate = null;

    try {
      const user = await getUserFromRequest(req);
      if (user) {
        const enrollmentDoc = await adminDb
          .collection("enrollments")
          .where("uid", "==", user.uid)
          .where("courseId", "==", courseId)
          .limit(1)
          .get();

        if (!enrollmentDoc.empty) {
          const enrollment = enrollmentDoc.docs[0].data();
          enrollmentStatus = "enrolled";
          enrollmentDate = enrollment.enrolledAt?.toDate()?.toISOString();
        }
      }
    } catch {
      // User not authenticated, continue without enrollment status
      console.log("User not authenticated, showing course as preview");
    }

    const course = {
      id: courseDoc.id,
      ...courseData,
      modules,
      questionnaires: assignments.map((assignment: Record<string, unknown>) => {
        const questionnaire = questionnaires.find(
          (q) => q.id === (assignment.questionnaireId as string)
        );
        return {
          ...assignment,
          questionnaire,
        };
      }),
      enrollment: {
        status: enrollmentStatus,
        enrolledAt: enrollmentDate,
      },
    };

    return NextResponse.json({
      success: true,
      course,
    });
  } catch (error) {
    console.error("Error fetching course details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
