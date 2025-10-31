"use client";

import Image from "next/image";
import Logo from "@/public/learn-ai-logo.png";

export function BrandHeader() {
  return (
    <header className="relative z-10 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-center fade-in-top">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="max-w-12 bg-primary rounded-2xl flex items-center justify-center">
                <Image
                  src={Logo}
                  alt="Logo"
                  className="p-1 bg-primary-foreground text-xl w-auto aspect-square"
                />
              </div>
              <div className="absolute -inset-1 bg-primary! rounded-2xl opacity-20 pulse-ring"></div>
            </div>
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ color: "var(--secondary)" }}
              >
                Learn.ai 4all
              </h1>
              <p className="" style={{ color: "var(--secondary-70)" }}>
                Administrator Portal
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
