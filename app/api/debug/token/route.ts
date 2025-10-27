import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    console.log("Debug endpoint called");

    // Check if Firebase Admin is initialized
    if (!adminAuth) {
      return NextResponse.json(
        {
          error: "Firebase Admin not initialized",
          env_check: {
            service_account_set: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
          },
        },
        { status: 500 }
      );
    }

    // Check authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "No authorization header",
          headers: Object.fromEntries(req.headers.entries()),
        },
        { status: 401 }
      );
    }

    const idToken = authHeader.slice(7);
    console.log("Token length:", idToken.length);

    // Try to verify the token
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    return NextResponse.json({
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken.role,
        provider: decodedToken.firebase.sign_in_provider,
        issued_at: decodedToken.iat,
        expires_at: decodedToken.exp,
      },
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      {
        error: "Token verification failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 401 }
    );
  }
}
