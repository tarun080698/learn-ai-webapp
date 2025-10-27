/**
 * POST /api/questionnaires/gate
 *
 * Check if user can access course/module based on questionnaire completion
 *
 * Body: {
 *   courseId: string;
 *   moduleId?: string;
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
  console.log("🚪 Checking questionnaire gating");

  try {
    // Verify authentication
    const authUser = await getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!adminDb) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { courseId, moduleId } = body;

    // Validate required fields
    if (!courseId) {
      return NextResponse.json(
        { error: "Missing required field: courseId" },
        { status: 400 }
      );
    }

    // Find pre-requisite questionnaire assignments
    let gatingAssignmentsQuery = adminDb
      .collection("questionnaire_assignments")
      .where("active", "==", true)
      .where("timing", "==", "pre")
      .where("scope.courseId", "==", courseId);

    if (moduleId) {
      // For module access, check both course-level and module-level pre-requisites
      const moduleGatingQuery = adminDb
        .collection("questionnaire_assignments")
        .where("active", "==", true)
        .where("timing", "==", "pre")
        .where("scope.moduleId", "==", moduleId);

      const [courseGating, moduleGating] = await Promise.all([
        gatingAssignmentsQuery.get(),
        moduleGatingQuery.get(),
      ]);

      // Combine both course and module gating requirements
      const allGatingDocs = [...courseGating.docs, ...moduleGating.docs];

      if (allGatingDocs.length === 0) {
        return NextResponse.json({
          allowed: true,
          reason: "No gating requirements",
          missingAssignments: [],
        });
      }

      // Check completion of all gating assignments
      const gatingAssignmentIds = allGatingDocs.map((doc) => doc.id);

      const completedResponsesSnapshot = await adminDb
        .collection("questionnaire_responses")
        .where("userId", "==", authUser.uid)
        .where("assignmentId", "in", gatingAssignmentIds)
        .where("status", "==", "completed")
        .get();

      const completedAssignmentIds = new Set(
        completedResponsesSnapshot.docs.map((doc) => doc.data().assignmentId)
      );

      const missingAssignments = allGatingDocs
        .filter((doc) => !completedAssignmentIds.has(doc.id))
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            questionnaireId: data.questionnaireId,
            scope: data.scope,
            timing: data.timing,
          };
        });

      const allowed = missingAssignments.length === 0;

      return NextResponse.json({
        allowed,
        reason: allowed
          ? "All requirements met"
          : "Missing required questionnaires",
        missingAssignments,
        totalRequired: gatingAssignmentIds.length,
        completed: completedAssignmentIds.size,
      });
    } else {
      // Course-level access check
      const gatingSnapshot = await gatingAssignmentsQuery.get();

      if (gatingSnapshot.empty) {
        return NextResponse.json({
          allowed: true,
          reason: "No gating requirements",
          missingAssignments: [],
        });
      }

      const gatingAssignmentIds = gatingSnapshot.docs.map((doc) => doc.id);

      const completedResponsesSnapshot = await adminDb
        .collection("questionnaire_responses")
        .where("userId", "==", authUser.uid)
        .where("assignmentId", "in", gatingAssignmentIds)
        .where("status", "==", "completed")
        .get();

      const completedAssignmentIds = new Set(
        completedResponsesSnapshot.docs.map((doc) => doc.data().assignmentId)
      );

      const missingAssignments = gatingSnapshot.docs
        .filter((doc) => !completedAssignmentIds.has(doc.id))
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            questionnaireId: data.questionnaireId,
            scope: data.scope,
            timing: data.timing,
          };
        });

      const allowed = missingAssignments.length === 0;

      return NextResponse.json({
        allowed,
        reason: allowed
          ? "All requirements met"
          : "Missing required questionnaires",
        missingAssignments,
        totalRequired: gatingAssignmentIds.length,
        completed: completedAssignmentIds.size,
      });
    }
  } catch (error) {
    console.error("❌ Error checking gate:", error);
    return NextResponse.json(
      { error: "Failed to check access" },
      { status: 500 }
    );
  }
}
