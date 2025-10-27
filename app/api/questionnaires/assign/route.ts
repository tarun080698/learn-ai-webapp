/**
 * POST /api/questionnaires/assign
 *
 * Assign a questionnaire to a course or module (Admin only)
 *
 * Body: {
 *   questionnaireId: string;
 *   scope: {
 *     type: "course" | "module";
 *     courseId: string;
 *     moduleId?: string;
 *   };
 *   timing: "pre" | "post";
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  console.log("📋 Creating questionnaire assignment");

  try {
    // Verify admin role
    const authUser = await getUserFromRequest(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (authUser.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    if (!adminDb) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { questionnaireId, scope, timing } = body;

    // Validate required fields
    if (!questionnaireId || !scope || !timing) {
      return NextResponse.json(
        { error: "Missing required fields: questionnaireId, scope, timing" },
        { status: 400 }
      );
    }

    // Validate scope
    if (!scope.type || !scope.courseId) {
      return NextResponse.json(
        { error: "Scope must have type and courseId" },
        { status: 400 }
      );
    }

    if (!["course", "module"].includes(scope.type)) {
      return NextResponse.json(
        { error: "Scope type must be 'course' or 'module'" },
        { status: 400 }
      );
    }

    if (scope.type === "module" && !scope.moduleId) {
      return NextResponse.json(
        { error: "moduleId required when scope type is 'module'" },
        { status: 400 }
      );
    }

    // Validate timing
    if (!["pre", "post"].includes(timing)) {
      return NextResponse.json(
        { error: "Timing must be 'pre' or 'post'" },
        { status: 400 }
      );
    }

    // Verify questionnaire exists
    const questionnaireDoc = await adminDb
      .collection("questionnaires")
      .doc(questionnaireId)
      .get();
    if (!questionnaireDoc.exists) {
      return NextResponse.json(
        { error: "Questionnaire not found" },
        { status: 404 }
      );
    }

    const questionnaireData = questionnaireDoc.data();

    // Create assignment document
    const assignmentId = uuidv4();
    const assignment = {
      id: assignmentId,
      questionnaireId,
      questionnaireVersion: questionnaireData?.version || 1,
      scope,
      timing,
      active: true,
      createdAt: new Date().toISOString(),
      createdBy: authUser.uid,
    };

    // Save to Firestore
    await adminDb
      .collection("questionnaire_assignments")
      .doc(assignmentId)
      .set(assignment);

    console.log(`✅ Assignment created: ${assignmentId}`);

    return NextResponse.json({
      success: true,
      assignmentId,
      assignment,
    });
  } catch (error) {
    console.error("❌ Error creating assignment:", error);
    return NextResponse.json(
      { error: "Failed to create assignment" },
      { status: 500 }
    );
  }
}
