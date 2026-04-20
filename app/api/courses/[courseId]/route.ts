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

    // Resolve enrollment up-front so we can decide how much detail to include.
    let enrollmentStatus: "enrolled" | null = null;
    let enrollmentDate: string | null = null;
    let enrollmentMeta: {
      progressPct?: number;
      lastModuleIndex?: number;
      completed?: boolean;
    } = {};
    let viewer: { uid: string; role?: "user" | "admin" } | null = null;

    try {
      const user = await getUserFromRequest(req);
      if (user) {
        viewer = { uid: user.uid, role: user.role };
        const enrollmentDoc = await adminDb
          .collection(COL.enrollments)
          .where("uid", "==", user.uid)
          .where("courseId", "==", courseId)
          .limit(1)
          .get();

        if (!enrollmentDoc.empty) {
          const enrollment = enrollmentDoc.docs[0].data();
          enrollmentStatus = "enrolled";
          enrollmentDate = enrollment.enrolledAt?.toDate?.()?.toISOString() ?? null;
          enrollmentMeta = {
            progressPct: enrollment.progressPct ?? 0,
            lastModuleIndex: enrollment.lastModuleIndex ?? 0,
            completed: !!enrollment.completed,
          };
        }
      }
    } catch {
      // Anonymous viewer; continue with preview-only data.
    }

    // Owners and admins always see full content (handy for previews).
    const includeFullContent =
      enrollmentStatus === "enrolled" ||
      viewer?.role === "admin" ||
      (viewer && courseData.ownerUid === viewer.uid);

    // Get modules for this course
    const modulesSnapshot = await adminDb
      .collection(COL.modules)
      .where("courseId", "==", courseId)
      .get();

    const allModules = modulesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const availableModules = allModules.filter(
      (module: Record<string, unknown>) =>
        module.published === true && !module.archived
    );

    const modules = availableModules
      .map((module: Record<string, unknown>) => {
        const base = {
          id: module.id,
          index: module.index,
          title: module.title,
          estMinutes: module.estMinutes,
          summary: module.summary,
          contentType: module.contentType,
        };
        if (!includeFullContent) return base;
        const rawAssets = Array.isArray(module.assets)
          ? (module.assets as Array<Record<string, unknown>>)
          : [];
        const assets = [...rawAssets].sort(
          (a, b) => Number(a.order ?? 0) - Number(b.order ?? 0)
        );
        return {
          ...base,
          contentUrl: module.contentUrl ?? null,
          body: module.body ?? "",
          assets,
        };
      })
      .sort((a, b) => Number(a.index || 0) - Number(b.index || 0));

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
        ...enrollmentMeta,
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
