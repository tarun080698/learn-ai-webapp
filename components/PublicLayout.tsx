"use client";

import { ReactNode } from "react";
import { PromoBanner } from "./landing/PromoBanner";
import { PublicHeader } from "./landing/PublicHeader";
import { PublicFooter } from "./landing/PublicFooter";

interface PublicLayoutProps {
  children: ReactNode;
  showPromoBanner?: boolean;
}

export function PublicLayout({
  children,
  showPromoBanner = true,
}: PublicLayoutProps) {
  return (
    <div className="min-h-screen">
      {showPromoBanner && <PromoBanner />}
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
