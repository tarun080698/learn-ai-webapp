/**
 * POST /api/modules/access
 *
 * Check if user can access a module (checks gating requirements).
 * Returns access status and any blocking requirements.
 *
 * curl -X POST http://localhost:3000/api/modules/access \
 *   -H "Authorization: Bearer $USER_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "courseId": "course_id_here",
 *     "moduleId": "module_id_here"
 *   }'
 */
import { NextRequest, NextResponse } from "next/server";
import {
  getUserFromRequest,
  assertUserProviderGoogle,
  jsonError,
} from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { canStartModule, getAssignmentsForContext } from "@/lib/firestore";
import { z } from "zod";

const zModuleAccess = z.object({
  courseId: z.string().min(1),
  moduleId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const validated = zModuleAccess.parse(body);

    // Require user authentication (Google provider)
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    try {
      assertUserProviderGoogle(user);
    } catch {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    if (!adminDb) {
      throw new Error("Firebase Admin not initialized");
    }

    // Check if user can start the module
    const accessCheck = await canStartModule(
      adminDb,
      user.uid,
      validated.courseId,
      validated.moduleId
    );

    if (accessCheck.allowed) {
      return NextResponse.json({
        allowed: true,
        courseId: validated.courseId,
        moduleId: validated.moduleId,
      });
    } else {
      // Get blocking assignments to help frontend show appropriate questionnaires
      const assignments = await getAssignmentsForContext(adminDb, {
        courseId: validated.courseId,
        moduleId: validated.moduleId,
      });

      const blockingAssignments = [];

      // Check for pre-course requirements
      if (assignments.preCourse) {
        blockingAssignments.push({
          assignmentId: assignments.preCourse.assignmentId,
          scope: "course",
          timing: "pre",
        });
      }

      // Check for pre-module requirements
      if (assignments.preModule) {
        blockingAssignments.push({
          assignmentId: assignments.preModule.assignmentId,
          scope: "module",
          timing: "pre",
        });
      }

      return NextResponse.json({
        allowed: false,
        reason: accessCheck.reason,
        courseId: validated.courseId,
        moduleId: validated.moduleId,
        blockingAssignments,
      });
    }
  } catch (error) {
    return jsonError(error);
  }
}
