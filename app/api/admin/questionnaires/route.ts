/**
 * GET /api/admin/questionnaires
 *
 * List all questionnaire templates for admin management.
 *
 * curl -X GET http://localhost:3000/api/admin/questionnaires \
 *   -H "Authorization: Bearer $ADMIN_TOKEN"
 */
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, requireAdmin, jsonError } from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { COL } from "@/lib/firestore";
import { formatDateISO } from "@/utils/dateUtils";

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
      return NextResponse.json(
        { error: "admin role required" },
        { status: 403 }
      );
    }

    if (!adminDb) {
      throw new Error("Firebase Admin not initialized");
    }

    // Fetch all questionnaires
    // Note: OrderBy removed for development compatibility, sorted in JavaScript
    const questionnairesSnapshot = await adminDb
      .collection(COL.questionnaires)
      .get();

    const questionnaires = questionnairesSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt:
          formatDateISO(doc.data().createdAt) || new Date().toISOString(),
        updatedAt: formatDateISO(doc.data().updatedAt),
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    return NextResponse.json({
      ok: true,
      questionnaires,
      count: questionnaires.length,
    });
  } catch (error) {
    return jsonError(error);
  }
}
