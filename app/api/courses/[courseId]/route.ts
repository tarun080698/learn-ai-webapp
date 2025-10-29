/**
 * GET /api/courses/[courseId]
 *
 * Fetch detailed information about a specific course including modules and questionnaires.
 * Public endpoint for course preview, but also includes enrollment status if user is authenticated.
 */
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getUserFromRequest } from "@/lib/auth";
import { COL } from "@/lib/firestore";

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
    const courseDoc = await adminDb.collection(COL.courses).doc(courseId).get();

    if (!courseDoc.exists) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const courseData = courseDoc.data();

    // Only return published AND non-archived courses
    if (!courseData?.published || courseData?.archived) {
      return NextResponse.json(
        { error: "Course not available" },
        { status: 404 }
      );
    }

    // Get modules for this course (published and non-archived only, metadata only)
    const modulesSnapshot = await adminDb
      .collection(COL.modules)
      .where("courseId", "==", courseId)
      .get();

    console.log(
      `Found ${modulesSnapshot.docs.length} modules for course ${courseId}`
    );

    // Filter for published AND non-archived modules, return metadata only
    const allModules = modulesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const availableModules = allModules.filter(
      (module: Record<string, unknown>) =>
        module.published === true && !module.archived
    );
    console.log(`Found ${availableModules.length} available modules`);

    // Return only metadata (no body, no assets)
    const modules = availableModules
      .map((module: Record<string, unknown>) => ({
        id: module.id,
        index: module.index,
        title: module.title,
        estMinutes: module.estMinutes,
        summary: module.summary,
        contentType: module.contentType,
      }))
      .sort((a, b) => (a.index || 0) - (b.index || 0));

    // Get course-level questionnaire assignments (active and non-archived)
    const assignmentsSnapshot = await adminDb
      .collection(COL.assignments)
      .where("scope.courseId", "==", courseId)
      .where("scope.type", "==", "course")
      .where("active", "==", true)
      .get();

    // Filter out archived assignments
    const assignments = assignmentsSnapshot.docs
      .filter((doc) => !doc.data().archived)
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

    // Get questionnaire details for assignments (non-archived only)
    const questionnaireIds = assignments.map(
      (a: Record<string, unknown>) => a.questionnaireId as string
    );
    const questionnaires: Array<Record<string, unknown>> = [];

    if (questionnaireIds.length > 0) {
      const questionnairesSnapshot = await adminDb
        .collection(COL.questionnaires)
        .where("__name__", "in", questionnaireIds)
        .get();

      questionnaires.push(
        ...questionnairesSnapshot.docs
          .filter((doc) => !doc.data().archived)
          .map((doc) => ({
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
          .collection(COL.enrollments)
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

    // Build public course data (excluding sensitive fields)
    const course = {
      id: courseDoc.id,
      title: courseData.title,
      description: courseData.description,
      durationMinutes: courseData.durationMinutes,
      level: courseData.level,
      heroImageUrl: courseData.heroImageUrl,
      published: courseData.published,
      createdAt: courseData.createdAt,
      updatedAt: courseData.updatedAt,
      publishedAt: courseData.publishedAt,
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
      moduleCount: modules.length, // Provide actual available module count
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
