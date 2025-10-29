"use client";

import { useAuth } from "@/app/(auth)/AuthProvider";
import { postLoginRedirect } from "@/utils/constants";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, ReactNode } from "react";

interface RouteGuardProps {
  children: ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { firebaseUser, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't do anything while still loading
    if (loading) return;

    // AUTHENTICATED USERS
    if (firebaseUser && role !== null) {
      // If admin is on non-admin page, redirect to admin
      if (role === "admin" && !pathname.startsWith("/admin")) {
        router.replace(postLoginRedirect.admin);
        return;
      }

      // If user is on admin page, redirect to dashboard
      if (role === "user" && pathname.startsWith("/admin")) {
        router.replace("/dashboard");
        return;
      }

      // If user is on login pages or home, redirect to their dashboard
      if (
        pathname === "/" ||
        pathname === "/login" ||
        pathname === "/admin/login"
      ) {
        if (role === "admin") {
          router.replace(postLoginRedirect.admin);
        } else {
          router.replace("/dashboard");
        }
        return;
      }
    }

    // UNAUTHENTICATED USERS
    if (!firebaseUser && !loading) {
      // Allow login pages
      if (pathname === "/login" || pathname === "/admin/login") {
        return; // Allow access to login pages
      }

      // Redirect to appropriate login based on path
      if (pathname.startsWith("/admin")) {
        router.replace("/admin/login");
        return;
      }

      // For all other protected routes, redirect to user login
      if (
        pathname !== "/" &&
        pathname !== "/login" &&
        pathname !== "/admin/login"
      ) {
        router.replace("/login");
        return;
      }
    }
  }, [firebaseUser, role, loading, pathname, router]);

  // Show loading while determining auth state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
