"use client";
import Logo from "@/public/learn-ai-logo.png";
import Image from "next/image";

import Link from "next/link";

export function PublicHeader() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header
      id="header"
      className="sticky top-0 z-50"
      style={{
        borderBottom: "1px solid var(--border)",
        backgroundColor: "var(--card)",
        boxShadow: "var(--shadow-sm)",
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
          </div>
        </div>
      </nav>
    </header>
  );
}
