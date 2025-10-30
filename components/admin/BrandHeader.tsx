"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBrain } from "@fortawesome/free-solid-svg-icons";

export function BrandHeader() {
  return (
    <header className="relative z-10 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-center fade-in-top">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faBrain}
                  className="text-primary-foreground text-xl"
                />
              </div>
              <div className="absolute -inset-1 bg-primary rounded-2xl opacity-20 pulse-ring"></div>
            </div>
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ color: "var(--secondary)" }}
              >
                Learn AI
              </h1>
              <p className="text-sm" style={{ color: "var(--secondary-70)" }}>
                Administrator Portal
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
