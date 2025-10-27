/**
 * GET /api/admin/assignments
 * 
 * List all questionnaire assignments for admin management.
 * 
 * curl -X GET http://localhost:3000/api/admin/assignments \
 *   -H "Authorization: Bearer $ADMIN_TOKEN"
 */
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, requireAdmin, jsonError } from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { COL } from "@/lib/firestore";

export async function GET(req: NextRequest) {
  try {
    // Require admin authentication
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    try {
      requireAdmin(user);
    } catch {
      return NextResponse.json({ error: "admin role required" }, { status: 403 });
    }

    if (!adminDb) {
      throw new Error("Firebase Admin not initialized");
    }

    // Fetch all assignments, ordered by creation date
    const assignmentsSnapshot = await adminDb
      .collection(COL.assignments)
      .orderBy("createdAt", "desc")
      .get();

    const assignments = assignmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()?.toISOString(),
      updatedAt: doc.data().updatedAt?.toDate()?.toISOString(),
    }));

    return NextResponse.json({
      ok: true,
      assignments,
      count: assignments.length
    });

  } catch (error) {
    return jsonError(error);
  }
}