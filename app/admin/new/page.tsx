/**
 * New Admin Dashboard Page
 * Multi-admin course management interface with ownership scoping
 */
"use client";

import React, { useState, useEffect } from "react";
import { EnhancedCourseWizard } from "@/components/admin/EnhancedCourseWizard";
import { useAuthenticatedMutation } from "@/hooks/useAuthenticatedFetch";
import { useAuth } from "@/app/(auth)/AuthProvider";

interface Course {
  id: string;
  title: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  published: boolean;
  moduleCount: number;
  durationMinutes: number;
  heroImageUrl?: string;
  updatedAt: string;
}

export default function NewAdminDashboard() {
  const { firebaseUser } = useAuth();
  const loadCoursesApi = useAuthenticatedMutation();

  const [view, setView] = useState<
    "dashboard" | "create-course" | "edit-course"
  >("dashboard");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);

  const loadCourses = async () => {
    if (!firebaseUser) return;

    try {
      const data = (await loadCoursesApi.mutate(
        "/api/admin/courses.mine",
        undefined,
        {
          method: "GET",
        }
      )) as { courses: Course[] };
      setCourses(data.courses || []);
    } catch (error) {
      console.error("Failed to load courses:", error);
    }
  };

  // Load admin's courses
  useEffect(() => {
    if (view === "dashboard") {
      loadCourses();
    }
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCourseCreated = (result: {
    courseId: string;
    isUpdate: boolean;
  }) => {
    console.log("Course created:", result);
    setView("dashboard");
    loadCourses(); // Refresh the list
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setView("edit-course");
  };

  // Dashboard view
  if (view === "dashboard") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Course Management
                </h1>
                <p className="mt-2 text-gray-600">
                  Create and manage your courses with multi-admin ownership
                </p>
              </div>
              <button
                onClick={() => setView("create-course")}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                + Create New Course
              </button>
            </div>
          </div>

          {/* Courses Grid */}
          {loadCoursesApi.loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading courses...</span>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📚</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No courses yet
              </h3>
              <p className="text-gray-600 mb-6">
                Get started by creating your first course. You'll only see
                courses you own.
              </p>
              <button
                onClick={() => setView("create-course")}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Create Your First Course
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {course.heroImageUrl && (
                    <div className="h-48 bg-gray-200">
                      <img
                        src={course.heroImageUrl}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {course.title}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          course.published
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {course.published ? "Published" : "Draft"}
                      </span>
                    </div>

                    <p className="text-gray-600  mb-4 line-clamp-3">
                      {course.description}
                    </p>

                    <div className="flex justify-between items-center  text-gray-500 mb-4">
                      <span className="capitalize">{course.level}</span>
                      <span>{course.durationMinutes} min</span>
                      <span>{course.moduleCount} modules</span>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditCourse(course)}
                        className="flex-1 px-3 py-2 text-blue-600 hover:text-blue-800 border border-blue-300 hover:border-blue-400 rounded  font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          /* TODO: Navigate to modules */
                        }}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded  font-medium transition-colors"
                      >
                        Modules
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Create course view
  if (view === "create-course") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Create New Course
            </h1>
            <p className="mt-2 text-gray-600">
              Set up your course details and get started
            </p>
          </div>

          <EnhancedCourseWizard
            mode="create"
            onComplete={handleCourseCreated}
            onCancel={() => setView("dashboard")}
          />
        </div>
      </div>
    );
  }

  // Edit course view
  if (view === "edit-course" && selectedCourse) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Edit Course</h1>
            <p className="mt-2 text-gray-600">Update your course details</p>
          </div>

          <EnhancedCourseWizard
            mode="edit"
            courseId={selectedCourse.id}
            initialData={{
              courseId: selectedCourse.id,
              courseData: {
                title: selectedCourse.title,
                description: selectedCourse.description,
                level: selectedCourse.level,
                durationHours: selectedCourse.durationMinutes / 60,
                heroImageUrl: selectedCourse.heroImageUrl,
              },
            }}
            onComplete={handleCourseCreated}
            onCancel={() => setView("dashboard")}
          />
        </div>
      </div>
    );
  }

  return null;
}
