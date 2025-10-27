"use client";

import { useAuth } from "@/app/(auth)/AuthProvider";
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
  }, [firebaseUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadEnrollments = async () => {
    if (!firebaseUser) return;

    setLoadingEnrollments(true);
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch("/api/enrollments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEnrollments(data.enrollments || []);
      } else {
        console.error("Failed to load enrollments:", response.statusText);
      }
    } catch (error) {
      console.error("Error loading enrollments:", error);
    } finally {
      setLoadingEnrollments(false);
    }
  };

  // Phase 2: Test enrollment function
  const testEnrollment = async () => {
    if (!firebaseUser || !testCourseId) {
      setEnrollResult("Please enter a course ID and ensure you are logged in");
      return;
    }

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch("/api/enroll", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-idempotency-key": `enroll-${testCourseId}-${Date.now()}`,
        },
        body: JSON.stringify({ courseId: testCourseId }),
      });

      const data = await response.json();
      setEnrollResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setEnrollResult(`Error: ${error}`);
    }
  };

  // Phase 2: Test progress completion function
  const testProgress = async () => {
    if (!firebaseUser || !testCourseId || !testModuleId) {
      setProgressResult(
        "Please enter course ID, module ID, and ensure you are logged in"
      );
      return;
    }

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-idempotency-key": `progress-${testModuleId}-${Date.now()}`,
        },
        body: JSON.stringify({
          courseId: testCourseId,
          moduleId: testModuleId,
          moduleIndex: testModuleIndex,
        }),
      });

      const data = await response.json();
      setProgressResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setProgressResult(`Error: ${error}`);
    }
  };

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

  if (!firebaseUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Welcome to Learn AI</h1>
          <p className="text-muted-foreground">
            Please sign in to access your dashboard.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
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
            📝 Questionnaires
          </Link>
          <Link
            href="/catalog"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            📚 Catalog
          </Link>
          <button
            onClick={signOutAll}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Streak Display */}
      <div className="bg-linear-to-r from-primary/10 to-secondary/10 p-6 rounded-lg mb-8">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {currentStreakDays || 0}
            </div>
            <div className="text-sm text-muted-foreground">Current Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary">
              {bestStreakDays || 0}
            </div>
            <div className="text-sm text-muted-foreground">Best Streak</div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">
              🔥 Keep learning daily to maintain your streak!
            </p>
          </div>
        </div>
      </div>

      {/* Phase 2: Learning System Testing Interface */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-green-900 mb-4">
          Phase 2: Learning System Testing
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enrollment Testing */}
          <div className="space-y-4">
            <h3 className="font-semibold text-green-800">
              Test Course Enrollment
            </h3>
            <input
              type="text"
              placeholder="Enter Course ID"
              value={testCourseId}
              onChange={(e) => setTestCourseId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={testEnrollment}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Enroll in Course
            </button>
            {enrollResult && (
              <div className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-32">
                <pre>{enrollResult}</pre>
              </div>
            )}
          </div>

          {/* Progress Testing */}
          <div className="space-y-4">
            <h3 className="font-semibold text-green-800">
              Test Module Completion
            </h3>
            <input
              type="text"
              placeholder="Course ID"
              value={testCourseId}
              onChange={(e) => setTestCourseId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="text"
              placeholder="Module ID"
              value={testModuleId}
              onChange={(e) => setTestModuleId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="number"
              placeholder="Module Index (0, 1, 2...)"
              value={testModuleIndex}
              onChange={(e) =>
                setTestModuleIndex(parseInt(e.target.value) || 0)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={testProgress}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Complete Module
            </button>
            {progressResult && (
              <div className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-32">
                <pre>{progressResult}</pre>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">
            Quick Test Instructions:
          </h4>
          <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
            <li>
              First, create seed data: POST /api/admin/seed.dev (need admin
              token)
            </li>
            <li>Publish the course: POST /api/admin/course.publish</li>
            <li>
              Use the returned courseId and moduleIds above to test enrollment
              and progress
            </li>
            <li>Watch progress percentage increase as you complete modules!</li>
          </ol>
        </div>
      </div>

      {/* My Courses Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">My Courses</h2>

        {loadingEnrollments ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading your courses...</p>
          </div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📚</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">No Courses Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start your learning journey by enrolling in a course.
            </p>
            <Link
              href="/catalog"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enrollment) => (
              <div
                key={enrollment.id}
                className="border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold mb-1">
                      {enrollment.course.title}
                    </h3>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {enrollment.course.level}
                    </span>
                  </div>
                  {enrollment.completed && (
                    <span className="text-green-600">✅</span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {enrollment.course.description}
                </p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{enrollment.progressPct}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${enrollment.progressPct}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {enrollment.completedCount} of{" "}
                    {enrollment.course.moduleCount} modules completed
                  </p>
                </div>

                <div className="flex justify-between items-center text-xs text-muted-foreground mb-4">
                  <span>⏱️ {enrollment.course.durationMinutes} min</span>
                  <span>
                    📅 Enrolled{" "}
                    {new Date(enrollment.enrolledAt).toLocaleDateString()}
                  </span>
                </div>

                <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm">
                  {enrollment.completed ? "Review" : "Continue Learning"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 border rounded-lg">
          <h3 className="font-semibold mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Enrolled Courses</span>
              <span className="font-medium">{enrollments.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Completed Courses</span>
              <span className="font-medium">
                {enrollments.filter((e) => e.completed).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">In Progress</span>
              <span className="font-medium">
                {
                  enrollments.filter((e) => !e.completed && e.progressPct > 0)
                    .length
                }
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 border rounded-lg">
          <h3 className="font-semibold mb-4">Learning Streak</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Streak</span>
              <span className="font-medium">{currentStreakDays || 0} days</span>
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
  );
}
