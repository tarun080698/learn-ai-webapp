import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, requireUser } from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    // Require authentication
    const user = await getUserFromRequest(req);
    requireUser(user);

    // Get some user doc info for debugging (no sensitive data)
    let userDoc = null;
    if (adminDb) {
      try {
        const doc = await adminDb.collection("users").doc(user.uid).get();
        if (doc.exists) {
          const data = doc.data();
          userDoc = {
            role: data?.role,
            currentStreakDays: data?.currentStreakDays,
            bestStreakDays: data?.bestStreakDays,
            lastLoginAt: data?.lastLoginAt?.toDate?.()?.toISOString(),
            createdAt: data?.createdAt?.toDate?.()?.toISOString(),
          };
        }
      } catch (error) {
        console.warn("Could not fetch user doc:", error);
      }
    }

    return NextResponse.json({
      ok: true,
      uid: user.uid,
      email: user.email,
      role: user.role,
      provider: user.provider,
      userDoc,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "401") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    console.error("Auth me API error:", error);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
