/**
 * Course Detail Page
 * Shows comprehensive course information including modules, questionnaires, and enrollment status
 */
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Navigation } from "@/app/components/Navigation";
import { useAuth } from "@/app/(auth)/AuthProvider";
import { useAuthenticatedMutation } from "@/hooks/useAuthenticatedFetch";

interface Module {
  id: string;
  title: string;
  summary: string;
  contentType: "video" | "text" | "pdf" | "link";
  contentUrl?: string;
  body?: string;
  estMinutes: number;
  index: number;
  published: boolean;
}

interface Questionnaire {
  id: string;
  questionnaireId: string;
  timing: "pre" | "post";
  active: boolean;
  questionnaire?: {
    id: string;
    title: string;
    purpose: string;
    questions: unknown[];
  };
}

interface Course {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  level: "beginner" | "intermediate" | "advanced";
  heroImageUrl?: string;
  published: boolean;
  modules: Module[];
  questionnaires: Questionnaire[];
  enrollment: {
    status: "enrolled" | null;
    enrolledAt?: string;
  };
}

interface CourseDetailPageProps {
  previewMode?: boolean;
}

export default function CourseDetailPage({
  previewMode = false,
}: CourseDetailPageProps) {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const { firebaseUser, loading: authLoading } = useAuth();
  const enrollApi = useAuthenticatedMutation();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load course data
  useEffect(() => {
    const loadCourse = async () => {
      if (!courseId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/courses/${courseId}`, {
          headers: firebaseUser
            ? {
                Authorization: `Bearer ${await firebaseUser.getIdToken()}`,
              }
            : {},
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Course not found");
          }
          throw new Error("Failed to load course");
        }

        const data = await response.json();
        setCourse(data.course);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load course");
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [courseId, firebaseUser]);

  // Handle enrollment
  const handleEnroll = async () => {
    if (!firebaseUser) {
      // Store the current URL to redirect back after login
      const returnUrl = `/courses/${courseId}`;
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    if (!course) return;

    try {
      const idempotencyKey = `enroll-${firebaseUser.uid}-${
        course.id
      }-${Date.now()}`;

      await enrollApi.mutate(
        "/api/enroll",
        {
          courseId: course.id,
        },
        {
          headers: {
            "x-idempotency-key": idempotencyKey,
          },
        }
      );

      // Reload course data to get updated enrollment status
      const response = await fetch(`/api/courses/${courseId}`, {
        headers: {
          Authorization: `Bearer ${await firebaseUser.getIdToken()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCourse(data.course);
        setSuccessMessage("🎉 Successfully enrolled in the course!");
        setError(null);

        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err) {
      console.error("Enrollment failed:", err);
      setError("Failed to enroll in course. Please try again.");
      setSuccessMessage(null);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4"></div>
              <div className="text-muted-foreground">Loading course...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">
              {error || "Course not found"}
            </div>
            <Link
              href="/catalog"
              className="text-primary hover:text-primary/80"
            >
              ← Back to Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isEnrolled = course.enrollment.status === "enrolled";
  const preQuestionnaires = course.questionnaires.filter(
    (q) => q.timing === "pre"
  );
  const postQuestionnaires = course.questionnaires.filter(
    (q) => q.timing === "post"
  );

  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="max-w-4xl mx-auto py-8 px-4">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link
            href="/catalog"
            className="text-primary hover:text-primary/80 text-sm"
          >
            ← Back to Catalog
          </Link>
        </div>

        {/* Course Header */}
        <div className="mb-8">
          {course.heroImageUrl && (
            <div className="mb-6">
              <Image
                src={course.heroImageUrl}
                alt={course.title}
                width={800}
                height={256}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
          )}

          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded capitalize">
                  {course.level}
                </span>
                <span>📚 {course.modules.length} modules</span>
                <span>⏱️ {course.durationMinutes} min</span>
              </div>
            </div>

            {/* Enrollment Status/Action */}
            <div className="flex flex-col items-end gap-2">
              {isEnrolled ? (
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg">
                  ✅ Enrolled
                  {course.enrollment.enrolledAt && (
                    <div className="text-xs mt-1">
                      {new Date(
                        course.enrollment.enrolledAt
                      ).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrollApi.loading}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {enrollApi.loading ? "Enrolling..." : "Enroll Now"}
                </button>
              )}

              {previewMode && !isEnrolled && (
                <div className="text-xs text-muted-foreground text-center">
                  Preview Mode
                </div>
              )}
            </div>
          </div>

          <p className="text-muted-foreground leading-relaxed">
            {course.description}
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
            {successMessage}
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-2 text-green-600 hover:text-green-800"
            >
              ✕
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        )}

        {/* Course Content */}
        <div className="space-y-8">
          {/* Pre-Course Questionnaires */}
          {preQuestionnaires.length > 0 && (
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                Pre-Course Assessment
              </h2>
              <div className="space-y-3">
                {preQuestionnaires.map((q) => (
                  <div key={q.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">
                          {q.questionnaire?.title || "Questionnaire"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {q.questionnaire?.purpose} •{" "}
                          {q.questionnaire?.questions?.length || 0} questions
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Required before starting
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Course Modules */}
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Course Modules</h2>
            <div className="space-y-4">
              {course.modules.map((module, index) => (
                <div key={module.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{module.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {module.summary}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="capitalize">{module.contentType}</span>
                        <span>⏱️ {module.estMinutes} min</span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {isEnrolled ? "Available" : "Preview"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Post-Course Questionnaires */}
          {postQuestionnaires.length > 0 && (
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                Post-Course Assessment
              </h2>
              <div className="space-y-3">
                {postQuestionnaires.map((q) => (
                  <div key={q.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">
                          {q.questionnaire?.title || "Questionnaire"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {q.questionnaire?.purpose} •{" "}
                          {q.questionnaire?.questions?.length || 0} questions
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Available after completion
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        {!isEnrolled && (
          <div className="mt-8 text-center border-t pt-8">
            <h3 className="text-lg font-semibold mb-2">
              Ready to start learning?
            </h3>
            <p className="text-muted-foreground mb-4">
              Join thousands of learners mastering AI skills
            </p>
            <button
              onClick={handleEnroll}
              disabled={enrollApi.loading}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {enrollApi.loading ? "Enrolling..." : "Enroll Now"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
