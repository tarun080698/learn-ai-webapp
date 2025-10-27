import { NextRequest, NextResponse } from "next/server";
import {
  getUserFromRequest,
  requireUser,
  ensureUserDoc,
  updateStreakTransaction,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Require authentication
    const user = await getUserFromRequest(req);
    if (!user) {
      console.log("Mark-login: No user found in request");
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    try {
      requireUser(user);
    } catch {
      console.log("Mark-login: User failed requireUser check");
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Determine role if not set in custom claims
    const role = user.role || "user";

    // Provider enforcement
    if (role === "user" && user.provider !== "google.com") {
      return NextResponse.json(
        {
          ok: false,
          code: "provider_not_allowed",
          message: "Users must sign in with Google",
        },
        { status: 403 }
      );
    }

    if (role === "admin" && user.provider !== "password") {
      return NextResponse.json(
        {
          ok: false,
          code: "provider_not_allowed",
          message: `Admins must sign in with email and password (got provider: ${user.provider})`,
        },
        { status: 403 }
      );
    } // Ensure user document exists
    await ensureUserDoc({
      uid: user.uid,
      email: user.email,
      displayName: user.token.name,
      photoURL: user.token.picture,
      role,
    });

    // Update streak and record login event
    const streakData = await updateStreakTransaction(user.uid);

    return NextResponse.json({
      ok: true,
      uid: user.uid,
      role,
      provider: user.provider,
      currentStreakDays: streakData.currentStreakDays,
      bestStreakDays: streakData.bestStreakDays,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "401") {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
      if (error.message === "403") {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    }

    console.error("Mark login API error:", error);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
