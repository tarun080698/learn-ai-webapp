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

    console.log({ user });
    // Determine role from custom claims first, then from user document
    let role = user.role;

    if (!role) {
      // Check user document in Firestore for role
      const { adminDb } = await import("@/lib/firebaseAdmin");
      if (adminDb) {
        try {
          const userDoc = await adminDb.collection("users").doc(user.uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            role = userData?.role;
            console.log(
              `Retrieved role from user document: ${role} for user: ${user.email}`
            );

            // Sync role to custom claims if found in document
            if (role) {
              const { adminAuth } = await import("@/lib/firebaseAdmin");
              if (adminAuth) {
                try {
                  await adminAuth.setCustomUserClaims(user.uid, { role });
                  console.log(
                    `Synced role to custom claims: ${role} for user: ${user.email}`
                  );
                } catch (error) {
                  console.error("Failed to sync role to custom claims:", error);
                }
              }
            }
          }
        } catch (error) {
          console.error("Failed to check user document for role:", error);
        }
      }
    }

    // Final fallback - default to "user" if no role found anywhere
    if (!role) {
      role = "user";
      console.log(`No role found, defaulting to 'user' for: ${user.email}`);
    }

    console.log(`Final role determination: ${role} for user: ${user.email}`);

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
          message: "Admins must sign in with email and password",
        },
        { status: 403 }
      );
    }

    // Ensure user document exists
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
