/**
 * GET /api/admin/course.complete
 *
 * Get complete course data including modules, assets, and questionnaire assignments.
 *
 * Query parameters:
 * - courseId: string - Course ID to fetch
 *
 * Returns:
 * - course: Complete course document
 * - modules: Array of modules with embedded assets
 * - assignments: Array of questionnaire assignments
 *
 * curl -X GET "http://localhost:3000/api/admin/course.complete?courseId=abc123" \
 *   -H "Authorization: Bearer $ADMIN_TOKEN"
 */
import { NextRequest } from "next/server";
import { getUserFromRequest, requireAdmin, jsonError } from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { COL } from "@/lib/firestore";
import {
  CourseDoc,
  ModuleDoc,
  QuestionnaireAssignmentDoc,
} from "@/types/models";

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
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      throw Object.assign(new Error("courseId is required"), {
        status: 400,
        code: "missing_course_id",
      });
    }

    // Get course document
    const courseDoc = await adminDb.collection(COL.courses).doc(courseId).get();

    if (!courseDoc.exists) {
      throw Object.assign(new Error("Course not found"), {
        status: 404,
        code: "course_not_found",
      });
    }

    const courseData = courseDoc.data() as CourseDoc;

    // Check ownership
    if (courseData.ownerUid !== user.uid) {
      throw Object.assign(new Error("Access denied: not the course owner"), {
        status: 403,
        code: "course_access_denied",
      });
    }

    // Get all modules for this course
    const modulesSnapshot = await adminDb
      .collection(COL.modules)
      .where("courseId", "==", courseId)
      .orderBy("index", "asc")
      .get();

    const modules = modulesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (ModuleDoc & { id: string })[];

    // Get all questionnaire assignments for this course
    const assignmentsSnapshot = await adminDb
      .collection(COL.assignments)
      .where("scope.courseId", "==", courseId)
      .where("ownerUid", "==", user.uid)
      .get();

    const assignments = assignmentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (QuestionnaireAssignmentDoc & { id: string })[];

    // Get questionnaire details for assignments
    const questionnaires = new Map();
    for (const assignment of assignments) {
      if (!questionnaires.has(assignment.questionnaireId)) {
        const questionnaireDoc = await adminDb
          .collection(COL.questionnaires)
          .doc(assignment.questionnaireId)
          .get();

        if (questionnaireDoc.exists) {
          questionnaires.set(assignment.questionnaireId, {
            id: questionnaireDoc.id,
            ...questionnaireDoc.data(),
          });
        }
      }
    }

    // Enhanced assignments with questionnaire data
    const enhancedAssignments = assignments.map((assignment) => ({
      ...assignment,
      questionnaire: questionnaires.get(assignment.questionnaireId) || null,
    }));

    return Response.json({
      ok: true,
      course: {
        id: courseDoc.id,
        ...courseData,
      },
      modules,
      assignments: enhancedAssignments,
      stats: {
        moduleCount: modules.length,
        assignmentCount: assignments.length,
        totalAssets: modules.reduce(
          (total, module) => total + (module.assets?.length || 0),
          0
        ),
      },
    });
  } catch (error) {
    console.error("Course.complete error:", error);
    return jsonError(error);
  }
}
