"use client";

import { useAuth } from "@/app/(auth)/AuthProvider";
import { RouteGuard } from "@/app/components/RouteGuard";
import { Navigation } from "@/app/components/Navigation";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const { signInWithGoogle, firebaseUser } = useAuth();
  const [signing, setSigning] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  // Redirect authenticated users
  useEffect(() => {
    if (firebaseUser) {
      const redirectTo = returnUrl || "/dashboard";
      router.push(redirectTo);
    }
  }, [firebaseUser, router, returnUrl]);

  const handleGoogleSignIn = async () => {
    try {
      setSigning(true);
      await signInWithGoogle();
      // Will be redirected by useEffect above when firebaseUser is set
    } catch (error) {
      console.error("Google sign in error:", error);
      setSigning(false);
    }
  };

  return (
    <RouteGuard>
      <div className="min-h-screen">
        <Navigation />
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold">Welcome to Learn AI</h1>
              <p className="mt-2 text-muted-foreground">
                Sign in with your Google account to continue
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleGoogleSignIn}
                disabled={signing}
                type="button"
                className="w-full justify-center gap-3 text-white bg-[#4285F4] hover:bg-[#4285F4]/90 focus:ring-4 focus:outline-none focus:ring-[#4285F4]/50 font-medium rounded-lg text-sm px-5 text-center inline-flex items-center dark:focus:ring-[#4285F4]/55 me-2 mb-2 disabled:cursor-not-allowed py-3 disabled:opacity-50 "
              >
                {signing ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 me-2"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      viewBox="0 0 18 19"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M8.842 18.083a8.8 8.8 0 0 1-8.65-8.948 8.841 8.841 0 0 1 8.8-8.652h.153a8.464 8.464 0 0 1 5.7 2.257l-2.193 2.038A5.27 5.27 0 0 0 9.09 3.4a5.882 5.882 0 0 0-.2 11.76h.124a5.091 5.091 0 0 0 5.248-4.057L14.3 11H9V8h8.34c.066.543.095 1.09.088 1.636-.086 5.053-3.463 8.449-8.4 8.449l-.186-.002Z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    Sign in with Google
                  </>
                )}
              </button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              By signing in, you agree to our terms of service and privacy
              policy.
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
