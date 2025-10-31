"use client";

import { useAuth } from "@/app/(auth)/AuthProvider";
import { RouteGuard } from "@/app/components/RouteGuard";
import { Navigation } from "@/app/components/Navigation";
import { useAuthenticatedMutation } from "@/hooks/useAuthenticatedFetch";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  CourseCard,
  CourseCardData,
  CourseCardAction,
} from "@/components/ui/CourseCard";

interface Enrollment {
  id: string;
  courseId: string;
  enrolledAt: string;
  completed: boolean;
  lastModuleIndex: number;
  completedCount: number;
  progressPct: number;
  course: {
    id: string;
    title: string;
    description: string;
    moduleCount: number;
    durationMinutes: number;
    level: string;
    published: boolean;
  };
}

export default function DashboardPage() {
  const { firebaseUser, loading, currentStreakDays, bestStreakDays } =
    useAuth();

  // Authenticated API hooks
  const loadEnrollmentsApi = useAuthenticatedMutation();
  const enrollInCourseApi = useAuthenticatedMutation();
  const updateProgressApi = useAuthenticatedMutation();

  // Enrollment state
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  // Phase 2: State for testing enrollment and progress
  const [enrollResult, setEnrollResult] = useState<string>("");
  const [progressResult, setProgressResult] = useState<string>("");
  const [testCourseId, setTestCourseId] = useState<string>("");
  const [testModuleId, setTestModuleId] = useState<string>("");
  const [testModuleIndex, setTestModuleIndex] = useState<number>(0);

  const loadEnrollments = async () => {
    if (!firebaseUser) return;

    try {
      const data = (await loadEnrollmentsApi.mutate(
        "/api/enrollments",
        undefined,
        {
          method: "GET",
        }
      )) as { enrollments: Enrollment[] };
      setEnrollments(data.enrollments || []);
    } catch (error) {
      console.error("Error loading enrollments:", error);
    }
  };

  // Load enrollments when user is authenticated
  useEffect(() => {
    if (firebaseUser) {
      loadEnrollments();
    }
  }, [firebaseUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // Test enrollment function
  const testEnrollment = async () => {
    if (!firebaseUser || !testCourseId) return;

    try {
      const data = await enrollInCourseApi.mutate("/api/enrollments", {
        courseId: testCourseId,
      });
      setEnrollResult(JSON.stringify(data, null, 2));
      loadEnrollments(); // Refresh the list
    } catch (error) {
      setEnrollResult(`Error: ${error}`);
    }
  };

  // Test progress function
  const testProgress = async () => {
    if (!firebaseUser || !testCourseId || !testModuleId) return;

    try {
      const data = await updateProgressApi.mutate("/api/progress", {
        courseId: testCourseId,
        moduleId: testModuleId,
        moduleIndex: testModuleIndex,
        completed: true,
      });
      setProgressResult(JSON.stringify(data, null, 2));
      loadEnrollments(); // Refresh to see updated progress
    } catch (error) {
      setProgressResult(`Error: ${error}`);
    }
  };

  // Using centralized date utilities now

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!firebaseUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Sign In Required</h2>
          <p className="text-muted-foreground">
            Please sign in to access your dashboard
          </p>
          <Link
            href="/login"
            className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <RouteGuard>
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">
                Welcome back, {firebaseUser.displayName || firebaseUser.email}!
              </h1>
            </div>
            <div className="flex gap-2"></div>
          </div>

          {/* Learning Streak Section */}
          <div className="hidden bg-linear-to-r from-blue-50/10 to-blue-200/10 p-6 rounded-lg mb-8">
            <div className="flex items-center gap-5">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {currentStreakDays || 0}
                </div>
                <div className=" text-muted-foreground">Current Streak</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">
                  {bestStreakDays || 0}
                </div>
                <div className=" text-muted-foreground">Best Streak</div>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Keep Learning!</h3>
              <p className=" text-muted-foreground">
                Maintain your daily learning streak to build consistent habits
                and track your progress.
              </p>
            </div>
          </div>

          {/* My Enrollments */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">My Enrollments</h2>
              <button
                onClick={loadEnrollments}
                disabled={loadEnrollmentsApi.loading}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 disabled:opacity-50"
              >
                {loadEnrollmentsApi.loading ? "Loading..." : "Refresh"}
              </button>
            </div>

            {loadEnrollmentsApi.loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                <p>Loading enrollments...</p>
              </div>
            ) : enrollments.length === 0 ? (
              <div className="text-center py-12 bg-muted/50 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">
                  No Enrollments Yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  Start your learning journey by enrolling in a course
                </p>
                <Link
                  href="/catalog"
                  className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  Browse Courses
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {enrollments.map((enrollment) => {
                  // Convert enrollment to CourseCardData
                  const courseData: CourseCardData = {
                    id: enrollment.course.id,
                    title: enrollment.course.title,
                    description: enrollment.course.description,
                    level: enrollment.course.level as
                      | "beginner"
                      | "intermediate"
                      | "advanced",
                    durationMinutes: enrollment.course.durationMinutes,
                    moduleCount: enrollment.course.moduleCount,
                    enrolled: true,
                    enrollmentId: enrollment.id,
                    progressPct: enrollment.progressPct,
                    completed: enrollment.completed,
                  };

                  // Generate actions based on completion status
                  const actions: CourseCardAction[] = enrollment.completed
                    ? [
                        {
                          label: "View Certificate",
                          href: `/courses/${enrollment.courseId}/certificate`,
                          variant: "secondary",
                        },
                        {
                          label: "Review Course",
                          href: `/courses/${enrollment.courseId}`,
                          variant: "outline",
                        },
                      ]
                    : [
                        {
                          label: "Continue Learning",
                          href: `/courses/${enrollment.courseId}`,
                          variant: "primary",
                        },
                      ];

                  return (
                    <CourseCard
                      key={enrollment.id}
                      course={courseData}
                      actions={actions}
                      showImage={false}
                      showProgress={true}
                      showStats={true}
                      size="md"
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Phase 2 Testing Section */}
          <div className="hidden mt-12 p-6 border rounded-lg bg-blue-50">
            <h3 className="text-lg font-semibold mb-4">
              Phase 2 Testing Tools (Development Only)
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Enrollment Testing */}
              <div className="space-y-4">
                <h4 className="font-medium">Test Enrollment</h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Course ID"
                    value={testCourseId}
                    onChange={(e) => setTestCourseId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <button
                    onClick={testEnrollment}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Test Enroll
                  </button>
                </div>
                {enrollResult && (
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                    {enrollResult}
                  </pre>
                )}
              </div>

              {/* Progress Testing */}
              <div className="space-y-4">
                <h4 className="font-medium">Test Progress</h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Course ID"
                    value={testCourseId}
                    onChange={(e) => setTestCourseId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Module ID"
                    value={testModuleId}
                    onChange={(e) => setTestModuleId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Module Index"
                    value={testModuleIndex}
                    onChange={(e) => setTestModuleIndex(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <button
                    onClick={testProgress}
                    className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    Update Progress
                  </button>
                </div>
                {progressResult && (
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                    {progressResult}
                  </pre>
                )}
              </div>
            </div>
          </div>

          {/* Learning Streak Detail */}
          <div className="mt-8 border bg-linear-to-r from-blue-50/10 to-blue-200/10 p-6 rounded-lg mb-8">
            <h3 className="font-semibold mb-4">Learning Streak</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Streak</span>
                <span className="font-medium">
                  {currentStreakDays || 0} days
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Best Streak</span>
                <span className="font-medium">{bestStreakDays || 0} days</span>
              </div>
              <p className="text-xs text-muted-foreground">
                🔥 Keep learning daily to maintain your streak!
              </p>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
