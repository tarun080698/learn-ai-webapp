/**
 * GET /api/modules/[moduleId]
 *
 * Returns the full module body/contentUrl for an enrolled student.
 * Requires the caller to have an active enrollment in the module's course.
 * Admins can access any module they own without an enrollment doc.
 */
import { NextRequest, NextResponse } from "next/server";
import {
  getUserFromRequest,
  assertUserProviderGoogle,
  jsonError,
} from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { COL, enrollmentId } from "@/lib/firestore";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { moduleId } = await params;

    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Admins are exempt from the Google-provider check; users must be Google.
    assertUserProviderGoogle(user);

    if (!adminDb) {
      throw new Error("Firebase Admin not initialized");
    }

    const moduleDoc = await adminDb.collection(COL.modules).doc(moduleId).get();
    if (!moduleDoc.exists) {
      return NextResponse.json({ error: "module_not_found" }, { status: 404 });
    }

    const moduleData = moduleDoc.data()!;

    if (!moduleData.published || moduleData.archived) {
      return NextResponse.json({ error: "module_not_available" }, { status: 404 });
    }

    // Enrollment gate: skip for admins, otherwise require enrollment doc.
    if (user.role !== "admin") {
      const enrollId = enrollmentId(user.uid, moduleData.courseId);
      const enrollDoc = await adminDb
        .collection(COL.enrollments)
        .doc(enrollId)
        .get();

      if (!enrollDoc.exists) {
        return NextResponse.json({ error: "not_enrolled" }, { status: 403 });
      }
    }

    return NextResponse.json({
      module: {
        id: moduleDoc.id,
        courseId: moduleData.courseId,
        index: moduleData.index ?? 0,
        title: moduleData.title,
        summary: moduleData.summary || "",
        contentType: moduleData.contentType,
        contentUrl: moduleData.contentUrl || null,
        body: moduleData.body || "",
        estMinutes: moduleData.estMinutes ?? 0,
        assets: Array.isArray(moduleData.assets) ? moduleData.assets : [],
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
