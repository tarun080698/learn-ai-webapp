"use client";

import { useState } from "react";

export function PromoBanner() {
  const [isVisible, setIsVisible] = useState(true);

  //   if (!isVisible) return null;
  if (true) return null;

  return (
    <div
      style={{
        background:
          "linear-gradient(to right, var(--primary), var(--secondary))",
        color: "var(--primary-foreground)",
      }}
      className="text-center py-3 relative overflow-hidden"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center text-sm font-medium">
          <i className="fa-solid fa-fire mr-2 animate-pulse"></i>
          <span>
            🎉 Limited Time: Get 40% off all courses with code LEARN2024 - Ends
            in 2 days!
          </span>
          <i className="fa-solid fa-fire ml-2 animate-pulse"></i>
        </div>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-primary-foreground hover:text-accent transition-colors"
      >
        <i className="fa-solid fa-xmark"></i>
      </button>
    </div>
  );
}
