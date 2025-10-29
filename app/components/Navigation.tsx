"use client";

import { useAuth } from "@/app/(auth)/AuthProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function Navigation() {
  const { firebaseUser, role, loading, signOutAll } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOutAll();
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  Logo
                </span>
              </div>
              <span className="font-bold text-xl">Learn AI</span>
            </Link>
          </div>

          {/* Navigation Links */}

          <div className="flex items-center gap-4 lg:gap-10 text-lg">
            {/* Always show catalog */}
            <Link
              href="/catalog"
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Catalog
            </Link>

            {loading ? (
              // Loading state
              <div className="w-6 h-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            ) : firebaseUser ? (
              // Authenticated user
              <>
                {role === "admin" ? (
                  <Link
                    href="/admin"
                    className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Admin
                  </Link>
                ) : (
                  <Link
                    href="/dashboard"
                    className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Dashboard
                  </Link>
                )}

                {/* User menu */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSignOut}
                    className="px-3 py-2 font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              // Unauthenticated user
              <>
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Login
                </Link>
                <Link
                  href="/admin/login"
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Admin
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
