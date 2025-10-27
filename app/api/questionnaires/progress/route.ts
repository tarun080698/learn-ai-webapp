/**
 * POST /api/questionnaires/progress
 *
 * Get questionnaire completion progress for a user
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
  console.log("📊 Fetching questionnaire progress");

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

    // Find relevant assignments
    let assignmentsQuery = adminDb
      .collection("questionnaire_assignments")
      .where("active", "==", true)
      .where("scope.courseId", "==", courseId);

    if (moduleId) {
      assignmentsQuery = assignmentsQuery.where(
        "scope.moduleId",
        "==",
        moduleId
      );
    }

    const assignmentsSnapshot = await assignmentsQuery.get();

    if (assignmentsSnapshot.empty) {
      return NextResponse.json({
        courseId,
        moduleId,
        assignments: [],
        completedCount: 0,
        totalCount: 0,
        completionRate: 0,
      });
    }

    // Get user's responses for these assignments
    const assignmentIds = assignmentsSnapshot.docs.map((doc) => doc.id);

    const responsesSnapshot = await adminDb
      .collection("questionnaire_responses")
      .where("userId", "==", authUser.uid)
      .where("assignmentId", "in", assignmentIds)
      .where("status", "==", "completed")
      .get();

    const completedAssignments = new Set(
      responsesSnapshot.docs.map((doc) => doc.data().assignmentId)
    );

    // Build progress data
    const assignments = assignmentsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        questionnaireId: data.questionnaireId,
        scope: data.scope,
        timing: data.timing,
        completed: completedAssignments.has(doc.id),
        completedAt: completedAssignments.has(doc.id)
          ? responsesSnapshot.docs
              .find((r) => r.data().assignmentId === doc.id)
              ?.data().completedAt
          : null,
      };
    });

    const totalCount = assignments.length;
    const completedCount = assignments.filter((a) => a.completed).length;
    const completionRate =
      totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return NextResponse.json({
      courseId,
      moduleId,
      assignments,
      completedCount,
      totalCount,
      completionRate: Math.round(completionRate * 100) / 100,
    });
  } catch (error) {
    console.error("❌ Error fetching progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}
