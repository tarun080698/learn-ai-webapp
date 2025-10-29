/**
 * Admin Layout
 * Provides navigation and common layout for admin pages
 */
"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/(auth)/AuthProvider";

export interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOutAll } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOutAll();
      router.push("/"); // Redirect to main app screen
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const navItems = [
    {
      href: "/admin",
      label: "Dashboard",
      icon: "📊",
      exact: true,
    },
    {
      href: "/admin/courses",
      label: "Courses",
      icon: "📚",
      exact: false,
    },
    {
      href: "/admin/questionnaires",
      label: "Questionnaires",
      icon: "📝",
      exact: false,
    },
    {
      href: "/admin/new",
      label: "New Course",
      icon: "➕",
      exact: false,
    },
  ];

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin" className="text-xl font-bold text-black">
                Learn AI Admin
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="hidden w-64 bg-white border-r border-black min-h-screen">
          <div className="p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item)
                    ? "bg-white text-black border border-black"
                    : "text-black hover:bg-white hover:border hover:border-black"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="mt-8 p-4 border-t border-black">
            <h3 className="text-xs font-semibold text-black uppercase tracking-wider mb-3">
              Quick Stats
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-black">Draft Courses</span>
                <span className="font-medium text-black">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black">Published</span>
                <span className="font-medium text-black">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black">Questionnaires</span>
                <span className="font-medium text-black">-</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
