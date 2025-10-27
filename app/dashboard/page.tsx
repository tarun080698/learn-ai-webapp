"use client";

import { useAuth } from "@/app/(auth)/AuthProvider";
import { RouteGuard } from "@/app/components/RouteGuard";
import { Navigation } from "@/app/components/Navigation";
import Link from "next/link";
import { useState, useEffect } from "react";

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
  const {
    firebaseUser,
    loading,
    signOutAll,
    currentStreakDays,
    bestStreakDays,
  } = useAuth();

  // Enrollment state
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  // Phase 2: State for testing enrollment and progress
  const [enrollResult, setEnrollResult] = useState<string>("");
  const [progressResult, setProgressResult] = useState<string>("");
  const [testCourseId, setTestCourseId] = useState<string>("");
  const [testModuleId, setTestModuleId] = useState<string>("");
  const [testModuleIndex, setTestModuleIndex] = useState<number>(0);

  // Load enrollments when user is authenticated
  useEffect(() => {
    if (firebaseUser) {
      loadEnrollments();
    }
  }, [firebaseUser]);

  const loadEnrollments = async () => {
    if (!firebaseUser) return;

    try {
      setLoadingEnrollments(true);
      const response = await fetch("/api/enrollments", {
        headers: {
          Authorization: `Bearer ${await firebaseUser.getIdToken()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEnrollments(data.enrollments || []);
      } else {
        console.error("Failed to load enrollments");
      }
    } catch (error) {
      console.error("Error loading enrollments:", error);
    } finally {
      setLoadingEnrollments(false);
    }
  };

  // Test enrollment function
  const testEnrollment = async () => {
    if (!firebaseUser || !testCourseId) return;

    try {
      const response = await fetch("/api/enrollments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await firebaseUser.getIdToken()}`,
        },
        body: JSON.stringify({ courseId: testCourseId }),
      });

      const data = await response.json();
      setEnrollResult(JSON.stringify(data, null, 2));

      if (response.ok) {
        loadEnrollments(); // Refresh the list
      }
    } catch (error) {
      setEnrollResult(`Error: ${error}`);
    }
  };

  // Test progress function
  const testProgress = async () => {
    if (!firebaseUser || !testCourseId || !testModuleId) return;

    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await firebaseUser.getIdToken()}`,
        },
        body: JSON.stringify({
          courseId: testCourseId,
          moduleId: testModuleId,
          moduleIndex: testModuleIndex,
          completed: true,
        }),
      });

      const data = await response.json();
      setProgressResult(JSON.stringify(data, null, 2));

      if (response.ok) {
        loadEnrollments(); // Refresh to see updated progress
      }
    } catch (error) {
      setProgressResult(`Error: ${error}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "beginner":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
              <h1 className="text-3xl font-bold">Student Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {firebaseUser.displayName || firebaseUser.email}!
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/questionnaires"
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                Questionnaires
              </Link>
              <Link
                href="/catalog"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Browse Catalog
              </Link>
              <button
                onClick={signOutAll}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Learning Streak Section */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg mb-8">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {currentStreakDays || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Current Streak
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">
                  {bestStreakDays || 0}
                </div>
                <div className="text-sm text-muted-foreground">Best Streak</div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Keep Learning!</h3>
                <p className="text-sm text-muted-foreground">
                  Maintain your daily learning streak to build consistent habits
                  and track your progress.
                </p>
              </div>
            </div>
          </div>

          {/* My Enrollments */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">My Enrollments</h2>
              <button
                onClick={loadEnrollments}
                disabled={loadingEnrollments}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 disabled:opacity-50"
              >
                {loadingEnrollments ? "Loading..." : "Refresh"}
              </button>
            </div>

            {loadingEnrollments ? (
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
              <div className="grid gap-4">
                {enrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">
                          {enrollment.course.title}
                        </h3>
                        <p className="text-muted-foreground mb-2">
                          {enrollment.course.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(
                              enrollment.course.level
                            )}`}
                          >
                            {enrollment.course.level}
                          </span>
                          <span className="text-muted-foreground">
                            {enrollment.course.moduleCount} modules
                          </span>
                          <span className="text-muted-foreground">
                            {enrollment.course.durationMinutes}min
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary mb-1">
                          {Math.round(enrollment.progressPct)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {enrollment.completedCount} of{" "}
                          {enrollment.course.moduleCount} modules
                        </div>
                      </div>
                    </div>

                    <div className="w-full bg-muted rounded-full h-2 mb-4">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${enrollment.progressPct}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        Enrolled on {formatDate(enrollment.enrolledAt)}
                      </span>
                      <div className="flex gap-2">
                        {enrollment.completed ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Completed ✅
                          </span>
                        ) : (
                          <Link
                            href={`/courses/${enrollment.courseId}`}
                            className="px-3 py-1 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                          >
                            Continue Learning
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Phase 2 Testing Section */}
          <div className="mt-12 p-6 border rounded-lg bg-blue-50">
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
          <div className="mt-8 p-6 border rounded-lg">
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
