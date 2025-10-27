/**
 * POST /api/questionnaires/remove
 *
 * Remove/deactivate a questionnaire assignment (Admin only)
 *
 * Body: {
 *   assignmentId: string;
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(request: NextRequest) {
  console.log("🗑️ Removing questionnaire assignment");

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
    const { assignmentId } = body;

    // Validate required fields
    if (!assignmentId) {
      return NextResponse.json(
        { error: "Missing required field: assignmentId" },
        { status: 400 }
      );
    }

    // Check if assignment exists
    const assignmentDoc = await adminDb
      .collection("questionnaire_assignments")
      .doc(assignmentId)
      .get();

    if (!assignmentDoc.exists) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Deactivate the assignment instead of deleting
    await adminDb
      .collection("questionnaire_assignments")
      .doc(assignmentId)
      .update({
        active: false,
        deactivatedAt: new Date().toISOString(),
        deactivatedBy: authUser.uid,
      });

    console.log(`✅ Assignment deactivated: ${assignmentId}`);

    return NextResponse.json({
      success: true,
      message: "Assignment deactivated successfully",
      assignmentId,
    });
  } catch (error) {
    console.error("❌ Error removing assignment:", error);
    return NextResponse.json(
      { error: "Failed to remove assignment" },
      { status: 500 }
    );
  }
}
