/**
 * Admin Layout
 * Provides navigation and common layout for admin pages
 */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/(auth)/AuthProvider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faSignOutAlt,
  faBars,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { AdminFooter } from "./AdminFooter";

export interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { firebaseUser: user, signOutAll } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      exact: true,
    },
    {
      href: "/admin/courses/new",
      label: "Create Course",
      exact: false,
    },
    // {
    //   href: "/admin/courses",
    //   label: "Courses",
    //   exact: false,
    // },
    {
      href: "/admin/questionnaires",
      label: "Questionnaires",
      exact: false,
    },
  ];

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsDropdownOpen(false);
    };

    if (isDropdownOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isDropdownOpen]);

  return (
    <div className="font-sans" style={{ backgroundColor: "var(--background)" }}>
      {/* Top Navigation Bar */}
      <header
        className="sticky top-0 z-50 h-16"
        style={{
          backgroundColor: "var(--card)",
          borderBottom: "1px solid var(--secondary-15)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/admin">
                <h1
                  className="text-xl font-semibold cursor-pointer"
                  style={{ color: "var(--secondary)" }}
                >
                  Learn AI — Admin
                </h1>
              </Link>
              <nav className="hidden md:flex items-center space-x-6">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-2 py-1 transition-all duration-150 ${
                      isActive(item) ? "border-b-2" : "hover:border-b-2"
                    }`}
                    style={{
                      color: isActive(item)
                        ? "var(--secondary)"
                        : "var(--secondary)",
                      borderColor: isActive(item)
                        ? "var(--accent)"
                        : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive(item)) {
                        e.currentTarget.style.color = "var(--accent)";
                        e.currentTarget.style.borderColor = "var(--accent)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive(item)) {
                        e.currentTarget.style.color = "var(--secondary)";
                        e.currentTarget.style.borderColor = "transparent";
                      }
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 rounded-lg transition-colors duration-150"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                style={{ color: "var(--secondary)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--accent-10)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  className="flex items-center space-x-2 p-2 rounded-lg transition-colors duration-150"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDropdownOpen(!isDropdownOpen);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--accent-10)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                    style={{
                      backgroundColor: "var(--primary)",
                      color: "var(--primary-foreground)",
                    }}
                  >
                    {user?.displayName?.charAt(0) ||
                      user?.email?.charAt(0) ||
                      "A"}
                  </div>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className="text-xs"
                    style={{ color: "var(--secondary)" }}
                  />
                </button>

                {/* User Dropdown */}
                {isDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg z-50"
                    style={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--secondary-15)",
                    }}
                  >
                    <div
                      className="p-4 border-b"
                      style={{ borderColor: "var(--secondary-15)" }}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                          style={{
                            backgroundColor: "var(--primary)",
                            color: "var(--primary-foreground)",
                          }}
                        >
                          {user?.displayName?.charAt(0) ||
                            user?.email?.charAt(0) ||
                            "A"}
                        </div>
                        <div>
                          <p
                            className="font-medium text-sm"
                            style={{ color: "var(--secondary)" }}
                          >
                            {user?.displayName || "Admin"}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "var(--secondary-70)" }}
                          >
                            {user?.email}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-150"
                        style={{ color: "var(--secondary)" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "var(--destructive-10)";
                          e.currentTarget.style.color = "var(--destructive)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "var(--secondary)";
                        }}
                      >
                        <FontAwesomeIcon
                          icon={faSignOutAlt}
                          className="text-sm"
                        />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div
            className="md:hidden border-t"
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--secondary-15)",
            }}
          >
            <div className="px-6 py-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-2 rounded-lg transition-colors duration-150"
                  style={{
                    color: isActive(item)
                      ? "var(--accent)"
                      : "var(--secondary)",
                    backgroundColor: isActive(item)
                      ? "var(--accent-10)"
                      : "transparent",
                  }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  onMouseEnter={(e) => {
                    if (!isActive(item)) {
                      e.currentTarget.style.backgroundColor =
                        "var(--accent-10)";
                      e.currentTarget.style.color = "var(--accent)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive(item)) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "var(--secondary)";
                    }
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="min-h-screen">{children}</main>
      <AdminFooter />
    </div>
  );
}
