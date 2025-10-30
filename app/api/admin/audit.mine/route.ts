import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, requireAdmin, jsonError } from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    requireAdmin(user);

    if (!adminDb) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 500 }
      );
    }

    // Get recent audit logs for this admin (last 50)
    const auditQuery = await adminDb
      .collection("adminAuditLogs")
      .where("actorUid", "==", user.uid)
      .orderBy("ts", "desc")
      .limit(50)
      .get();

    const logs = auditQuery.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching admin audit logs:", error);
    return jsonError(error);
  }
}
