/**
 * Admin Dashboard
 * Overview of admin's content and quick actions using new admin architecture
 */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAuth } from "@/app/(auth)/AuthProvider";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";

interface DashboardStats {
  courses: {
    total: number;
    published: number;
    drafts: number;
  };
  modules: {
    total: number;
  };
  questionnaires: {
    total: number;
    byType: {
      survey: number;
      quiz: number;
      assessment: number;
    };
  };
  assignments: {
    total: number;
    active: number;
  };
}

interface RecentItem {
  id: string;
  title: string;
  type: "course" | "questionnaire";
  status: string;
  updatedAt: Date;
}

interface Course {
  id: string;
  title: string;
  published: boolean;
  updatedAt: { _seconds: number };
}

interface Questionnaire {
  id: string;
  title: string;
  purpose: "survey" | "quiz" | "assessment";
  updatedAt: { seconds: number };
}

interface Assignment {
  id: string;
  active: boolean;
}

interface Module {
  id: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { firebaseUser } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!firebaseUser) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch data from all endpoints using standardized auth
        const [coursesRes, modulesRes, questionnairesRes, assignmentsRes] =
          await Promise.all([
            authenticatedFetch("/api/admin/courses.mine?limit=100"),
            authenticatedFetch("/api/admin/modules.mine?limit=100"),
            authenticatedFetch("/api/admin/questionnaires.mine?limit=100"),
            authenticatedFetch("/api/admin/assignments.mine?limit=100"),
          ]);

        const [coursesData, modulesData, questionnairesData, assignmentsData] =
          await Promise.all([
            coursesRes.json(),
            modulesRes.json(),
            questionnairesRes.json(),
            assignmentsRes.json(),
          ]);

        // Calculate stats with proper typing
        const courses = (coursesData.courses || []) as Course[];
        const questionnaires = (questionnairesData.questionnaires ||
          []) as Questionnaire[];
        const assignments = (assignmentsData.assignments || []) as Assignment[];
        const modules = (modulesData.modules || []) as Module[];

        const courseStats = {
          total: courses.length,
          published: courses.filter((c) => c.published).length,
          drafts: courses.filter((c) => !c.published).length,
        };

        const questionnaireStats = {
          total: questionnaires.length,
          byType: {
            survey: questionnaires.filter((q) => q.purpose === "survey").length,
            quiz: questionnaires.filter((q) => q.purpose === "quiz").length,
            assessment: questionnaires.filter((q) => q.purpose === "assessment")
              .length,
          },
        };

        setStats({
          courses: courseStats,
          modules: {
            total: modules.length,
          },
          questionnaires: questionnaireStats,
          assignments: {
            total: assignments.length,
            active: assignments.filter((a) => a.active).length,
          },
        });
        console.log({ courses });

        // Get recent items with proper typing
        const recentCourses = courses.slice(0, 3).map((course) => ({
          id: course.id,
          title: course.title,
          type: "course" as const,
          status: course.published ? "Published" : "Draft",
          updatedAt: new Date(course.updatedAt._seconds * 1000),
        }));

        const recentQuestionnaires = questionnaires.slice(0, 2).map((q) => ({
          id: q.id,
          title: q.title,
          type: "questionnaire" as const,
          status: q.purpose,
          updatedAt: new Date(q.updatedAt.seconds * 1000),
        }));

        const recent = [...recentCourses, ...recentQuestionnaires]
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
          .slice(0, 5);

        setRecentItems(recent);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load dashboard"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [firebaseUser, authenticatedFetch]);

  const StatCard = ({
    title,
    value,
    subtitle,
    color = "blue",
  }: {
    title: string;
    value: number | string;
    subtitle?: string;
    color?: "blue" | "green" | "purple" | "orange";
  }) => {
    const colorClasses = {
      blue: "bg-blue-50 text-blue-700",
      green: "bg-green-50 text-green-700",
      purple: "bg-purple-50 text-purple-700",
      orange: "bg-orange-50 text-orange-700",
    };

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p
                className={`text-sm font-medium mt-1 px-2 py-1 rounded-full inline-block ${colorClasses[color]}`}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const QuickAction = ({
    href,
    icon,
    title,
    description,
  }: {
    href: string;
    icon: string;
    title: string;
    description: string;
  }) => (
    <Link
      href={href}
      className="block bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-4">
        <div className="text-2xl">{icon}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <div className="text-gray-400">→</div>
      </div>
    </Link>
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <div className="text-gray-600">Loading dashboard...</div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-red-800">
                <strong>Error:</strong> {error}
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back! Here&apos;s an overview of your content.
            </p>
          </div>

          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Courses"
                value={stats.courses.total}
                subtitle={`${stats.courses.published} published`}
                color="blue"
              />
              <StatCard
                title="Course Modules"
                value={stats.modules.total}
                color="green"
              />
              <StatCard
                title="Questionnaires"
                value={stats.questionnaires.total}
                subtitle={`${stats.questionnaires.byType.survey} surveys`}
                color="purple"
              />
              <StatCard
                title="Assignments"
                value={stats.assignments.total}
                subtitle={`${stats.assignments.active} active`}
                color="orange"
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quick Actions */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="space-y-4">
                <QuickAction
                  href="/admin/new"
                  icon="➕"
                  title="Create New Course"
                  description="Start building a new course with the course wizard"
                />
                <QuickAction
                  href="/admin/questionnaires"
                  icon="📝"
                  title="Manage Questionnaires"
                  description="Create surveys, quizzes, and assessments"
                />
                <QuickAction
                  href="/admin/courses"
                  icon="📚"
                  title="View All Courses"
                  description="Manage your existing courses and modules"
                />
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Activity
              </h2>
              <div className="bg-white rounded-lg border border-gray-200">
                {recentItems.length === 0 ? (
                  <div className="p-6 text-center text-gray-600">
                    No recent activity. Start creating content!
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {recentItems.map((item) => (
                      <div key={`${item.type}-${item.id}`} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">
                                {item.type === "course" ? "📚" : "📝"}
                              </span>
                              <span className="font-medium text-gray-900">
                                {item.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  item.status === "Published"
                                    ? "bg-green-100 text-green-700"
                                    : item.status === "Draft"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {item.status}
                              </span>
                              <span className="text-xs text-gray-500">
                                {item.updatedAt.toLocaleDateString()}
                              </span>
                              {console.log({ item })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
