"use client";

import { RouteGuard } from "@/app/components/RouteGuard";
import { BrandHeader } from "@/components/admin/BrandHeader";
import { FloatingShapes } from "@/components/admin/FloatingShapes";
import { SecurityBadge } from "@/components/admin/SecurityBadge";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { FeaturesOverview } from "@/components/admin/FeaturesOverview";
import { SecurityStandards } from "@/components/admin/SecurityStandards";
import { PlatformStats } from "@/components/admin/PlatformStats";
import { RecentActivity } from "@/components/admin/RecentActivity";
import { SystemStatus } from "@/components/admin/SystemStatus";
import { HelpSupport } from "@/components/admin/HelpSupport";
import { AdminFooter } from "@/components/admin/AdminFooter";

export default function AdminLoginPage() {
  return (
    <RouteGuard>
      <div className="bg-background font-sans login-bg min-h-screen">
        {/* Floating Background Shapes */}
        <FloatingShapes />

        {/* Top Brand Header */}
        <BrandHeader />

        {/* Security Badge */}
        <div className="px-6">
          <SecurityBadge />
        </div>

        {/* Main Sign In Form */}
        <AdminLoginForm />

        {/* Features Overview Section */}
        <FeaturesOverview />

        {/* Security Standards Section */}
        <SecurityStandards />

        {/* Quick Stats Section */}
        <PlatformStats />

        {/* Recent Activity Feed */}
        <RecentActivity />

        {/* System Status */}
        <SystemStatus />

        {/* Help & Support */}
        <HelpSupport />

        {/* Footer */}
        <AdminFooter />
      </div>
    </RouteGuard>
  );
}
