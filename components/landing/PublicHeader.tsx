"use client";
import Logo from "@/public/learn-ai-logo.png";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/(auth)/AuthProvider";

export function PublicHeader() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { firebaseUser, signOutAll } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showUserMenu]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleLogout = async () => {
    try {
      await signOutAll();
      setShowUserMenu(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header
      id="header"
      className="sticky top-0 z-50"
      style={{
        borderBottom: "1px solid var(--border)",
        backgroundColor: "var(--card)",
      }}
    >
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div
                className="max-w-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: "var(--primary)" }}
              >
                <Image
                  src={Logo}
                  alt="Logo"
                  className="p-1 text-xl w-auto aspect-square"
                  style={{ backgroundColor: "var(--primary-foreground)" }}
                />
              </div>
              <span
                className="text-xl font-bold"
                style={{ color: "var(--secondary)" }}
              >
                Learn.ai 4all
              </span>
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <Link
                href="/catalog"
                className="font-medium transition-colors hover:opacity-80"
                style={{ color: "var(--muted-foreground)" }}
              >
                Browse Courses
              </Link>
              <button
                onClick={() => scrollToSection("value-props")}
                className="font-medium transition-colors hover:opacity-80"
                style={{
                  color: "var(--muted-foreground)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                About
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {firebaseUser ? (
              // Logged in user menu
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors hover:opacity-80"
                  style={{ backgroundColor: "var(--muted)" }}
                >
                  {firebaseUser.photoURL ? (
                    <Image
                      src={firebaseUser.photoURL}
                      alt="Profile"
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <i
                      className="fa-solid fa-user"
                      style={{ color: "var(--primary)" }}
                    ></i>
                  )}
                  <span
                    style={{ color: "var(--secondary)" }}
                    className="font-medium"
                  >
                    {firebaseUser.displayName ||
                      firebaseUser.email?.split("@")[0] ||
                      "User"}
                  </span>
                  <i
                    className="fa-solid fa-chevron-down text-xs"
                    style={{ color: "var(--muted-foreground)" }}
                  ></i>
                </button>

                {showUserMenu && (
                  <div
                    className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-50"
                    style={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div className="py-2">
                      <Link
                        href="/dashboard"
                        className="block px-4 py-2 transition-colors hover:opacity-80"
                        style={{ color: "var(--muted-foreground)" }}
                        onClick={() => setShowUserMenu(false)}
                      >
                        <i className="fa-solid fa-tachometer-alt mr-2"></i>
                        Dashboard
                      </Link>
                      <Link
                        href="/catalog"
                        className="block px-4 py-2 transition-colors hover:opacity-80"
                        style={{ color: "var(--muted-foreground)" }}
                        onClick={() => setShowUserMenu(false)}
                      >
                        <i className="fa-solid fa-book mr-2"></i>
                        My Courses
                      </Link>
                      <div
                        className="h-px my-2"
                        style={{ backgroundColor: "var(--border)" }}
                      ></div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 transition-colors hover:opacity-80"
                        style={{ color: "var(--destructive)" }}
                      >
                        <i className="fa-solid fa-sign-out-alt mr-2"></i>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Not logged in - show login options
              <>
                <Link
                  href="/login"
                  className="font-medium transition-colors hover:opacity-80"
                  style={{ color: "var(--primary)" }}
                >
                  Sign In
                </Link>
                <Link
                  href="/admin/login"
                  className="px-4 py-2 rounded-lg font-medium transition-all hover:opacity-90"
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "var(--primary-foreground)",
                  }}
                >
                  Admin
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
