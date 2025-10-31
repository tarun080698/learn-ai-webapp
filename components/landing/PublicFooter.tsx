"use client";

import Link from "next/link";
import Logo from "@/public/learn-ai-logo.png";
import Image from "next/image";

export function PublicFooter() {
  return (
    <footer
      id="footer"
      className="py-16"
      style={{
        backgroundColor: "var(--secondary)",
        color: "var(--secondary-foreground)",
      }}
    >
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <div className="max-w-12 bg-primary rounded-2xl flex items-center justify-center">
                <Image
                  src={Logo}
                  alt="Logo"
                  className="p-1 bg-primary-foreground text-xl w-auto aspect-square"
                />
              </div>
              <span className="text-2xl font-bold">Learn.ai 4all</span>
            </div>
            <p
              className="leading-relaxed mb-6 max-w-md"
              style={{
                color: "var(--secondary-foreground)",
                opacity: 0.8,
              }}
            >
              Empowering learners worldwide with AI skills through expert-led
              courses, hands-on projects, and personalized learning paths.
            </p>
            <div className="flex space-x-4 hidden">
              <Link
                href="#"
                className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
                style={{
                  backgroundColor: "var(--secondary-foreground)",
                  opacity: 0.1,
                }}
              >
                <i className="fa-brands fa-twitter"></i>
              </Link>
              <Link
                href="#"
                className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
                style={{
                  backgroundColor: "var(--secondary-foreground)",
                  opacity: 0.1,
                }}
              >
                <i className="fa-brands fa-facebook"></i>
              </Link>
              <Link
                href="#"
                className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
                style={{
                  backgroundColor: "var(--secondary-foreground)",
                  opacity: 0.1,
                }}
              >
                <i className="fa-brands fa-linkedin"></i>
              </Link>
              <Link
                href="#"
                className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
                style={{
                  backgroundColor: "var(--secondary-foreground)",
                  opacity: 0.1,
                }}
              >
                <i className="fa-brands fa-instagram"></i>
              </Link>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-6">Learning</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/catalog"
                  className="transition-colors hover:opacity-80"
                  style={{
                    color: "var(--secondary-foreground)",
                    opacity: 0.8,
                  }}
                >
                  Browse Catalog
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="transition-colors hover:opacity-80"
                  style={{
                    color: "var(--secondary-foreground)",
                    opacity: 0.8,
                  }}
                >
                  My Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/questionnaires"
                  className="hidden transition-colors hover:opacity-80"
                  style={{
                    color: "var(--secondary-foreground)",
                    opacity: 0.8,
                  }}
                >
                  Assessments
                </Link>
              </li>
            </ul>
          </div>
          <div className="hidden">
            <h3 className="text-lg font-semibold mb-6">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/help"
                  className="transition-colors hover:opacity-80"
                  style={{
                    color: "var(--secondary-foreground)",
                    opacity: 0.8,
                  }}
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="transition-colors hover:opacity-80"
                  style={{
                    color: "var(--secondary-foreground)",
                    opacity: 0.8,
                  }}
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="transition-colors hover:opacity-80"
                  style={{
                    color: "var(--secondary-foreground)",
                    opacity: 0.8,
                  }}
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="transition-colors hover:opacity-80"
                  style={{
                    color: "var(--secondary-foreground)",
                    opacity: 0.8,
                  }}
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div
          className="border-t mt-12 pt-8 flex flex-col md:flex-row items-center justify-between"
          style={{
            borderColor: "var(--secondary-foreground)",
            // opacity: 0.2,
          }}
        >
          <p
            className="text-sm"
            style={{
              color: "var(--secondary-foreground)",
              opacity: 0.6,
            }}
          >
            © {new Date().getFullYear()} Learn.ai 4all. All rights reserved.
          </p>
          <div className="hidden flex items-center space-x-6 mt-4 md:mt-0">
            <Link
              href="/status"
              className="transition-colors hover:opacity-80 text-sm"
              style={{
                color: "var(--secondary-foreground)",
                opacity: 0.6,
              }}
            >
              System Status
            </Link>
            <Link
              href="/careers"
              className="transition-colors hover:opacity-80 text-sm"
              style={{
                color: "var(--secondary-foreground)",
                opacity: 0.6,
              }}
            >
              Careers
            </Link>
            <Link
              href="/blog"
              className="transition-colors hover:opacity-80 text-sm"
              style={{
                color: "var(--secondary-foreground)",
                opacity: 0.6,
              }}
            >
              Blog
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
