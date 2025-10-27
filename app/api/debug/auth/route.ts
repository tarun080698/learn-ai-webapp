import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user document from Firestore
    const userDoc = adminDb
      ? await adminDb.collection("users").doc(user.uid).get()
      : null;
    const userData = userDoc?.exists ? userDoc.data() : null;

    return NextResponse.json({
      currentUser: {
        uid: user.uid,
        email: user.email,
        roleFromCustomClaims: user.role,
        provider: user.provider,
      },
      userDocument: userData,
      roleSource: user.role
        ? "custom-claims"
        : userData?.role
        ? "firestore-document"
        : "default",
    });
  } catch (error) {
    console.error("Debug auth error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
