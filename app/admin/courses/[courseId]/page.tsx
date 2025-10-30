/**
 * Admin Course Edit Page
 * Edit course details and manage course-level questionnaires (pre/post)
 */
"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import { useAuth } from "@/app/(auth)/AuthProvider";
import {
  useAuthenticatedFetch,
  useAuthenticatedMutation,
} from "@/hooks/useAuthenticatedFetch";
import { CourseDoc, QuestionnaireAssignmentDoc } from "@/types/models";
import { QuestionnaireAssignmentModal } from "@/components/admin/QuestionnaireAssignmentModal";

interface Course extends CourseDoc {
  id: string;
  moduleCount: number;
}

interface Assignment extends QuestionnaireAssignmentDoc {
  id: string;
  questionnaireName: string;
}

export default function AdminCourseEditPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const { firebaseUser } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();
  const updateCourseApi = useAuthenticatedMutation();

  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    durationMinutes: 0,
    level: "beginner" as "beginner" | "intermediate" | "advanced",
    heroImageUrl: "",
  });

  // Load course data
  useEffect(() => {
    const loadCourseData = async () => {
      if (!firebaseUser || !courseId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Load course details
        const courseResponse = await authenticatedFetch(
          `/api/admin/courses.mine?courseId=${courseId}`
        );
        const courseData = await courseResponse.json();

        if (!courseData.courses || courseData.courses.length === 0) {
          throw new Error("Course not found");
        }

        const courseDetail = courseData.courses[0];
        setCourse(courseDetail);
        setFormData({
          title: courseDetail.title,
          description: courseDetail.description,
          durationMinutes: courseDetail.durationMinutes,
          level: courseDetail.level,
          heroImageUrl: courseDetail.heroImageUrl || "",
        });

        // Load course assignments
        const assignmentsResponse = await authenticatedFetch(
          `/api/admin/assignments.mine?courseId=${courseId}&scope=course`
        );
        const assignmentsData = await assignmentsResponse.json();
        setAssignments(assignmentsData.assignments || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load course");
      } finally {
        setIsLoading(false);
      }
    };

    loadCourseData();
  }, [firebaseUser, courseId, authenticatedFetch]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateCourseApi.mutate("/api/admin/course.upsert", {
        courseId,
        ...formData,
      });

      // Update local state
      if (course) {
        setCourse({
          ...course,
          ...formData,
        });
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update course");
    }
  };

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "durationMinutes" ? parseInt(value) || 0 : value,
    }));
  };

  // Reload assignments after changes
  const reloadAssignments = async () => {
    try {
      const assignmentsResponse = await authenticatedFetch(
        `/api/admin/assignments.mine?courseId=${courseId}&scope=course`
      );
      const assignmentsData = await assignmentsResponse.json();
      setAssignments(assignmentsData.assignments || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reload assignments"
      );
    }
  };

  if (!firebaseUser) {
    return (
      <div className="p-6">
        <div className="text-center text-black">Please log in to continue.</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-black">Loading course...</div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="text-black mb-4">Course not found</div>
          <Link
            href="/admin/courses"
            className="text-black hover:text-black border-b border-black"
          >
            ← Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/admin/courses"
            className="text-black hover:text-black border-b border-black text-sm mb-2 inline-block"
          >
            ← Back to Courses
          </Link>
          <h1 className="text-2xl font-bold text-black">Edit Course</h1>
          <p className="text-black mt-1">{course.title}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/courses/${courseId}/modules`}
            className="bg-white text-black border border-black px-4 py-2 rounded-lg hover:bg-white transition-colors"
          >
            Manage Modules ({course.moduleCount || 0})
          </Link>
          <span className="px-3 py-2 rounded-lg text-sm font-medium bg-white text-black border border-black">
            {course.published ? "Published" : "Draft"}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-white border border-black text-black px-4 py-3 rounded-lg mb-6">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-black hover:text-black"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Details Form */}
        <div className="bg-white border border-black rounded-lg p-6">
          <h2 className="text-lg font-semibold text-black mb-4">
            Course Details
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-black mb-1"
              >
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-black mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                required
                className="w-full border-black focus:ring-black focus:border-black bg-input border rounded-xl px-4 py-3 text-secondary focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-150"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="durationMinutes"
                  className="block text-sm font-medium text-black mb-1"
                >
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  id="durationMinutes"
                  name="durationMinutes"
                  value={formData.durationMinutes}
                  onChange={handleInputChange}
                  min="1"
                  required
                  className="w-full px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                />
              </div>

              <div>
                <label
                  htmlFor="level"
                  className="block text-sm font-medium text-black mb-1"
                >
                  Level
                </label>
                <select
                  id="level"
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="heroImageUrl"
                className="block text-sm font-medium text-black mb-1"
              >
                Hero Image URL (optional)
              </label>
              <input
                type="url"
                id="heroImageUrl"
                name="heroImageUrl"
                value={formData.heroImageUrl}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              />
            </div>

            <button
              type="submit"
              disabled={updateCourseApi.loading}
              className="w-full bg-white text-black border border-black py-2 px-4 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {updateCourseApi.loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* Course Questionnaires */}
        <div className="bg-white border border-black rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-black">
              Course Questionnaires
            </h2>
            <button
              onClick={() => setShowAssignmentModal(true)}
              className="text-black hover:text-black border-b border-black text-sm"
            >
              + Add Questionnaire
            </button>
          </div>

          {assignments.length === 0 ? (
            <div className="text-center py-8 text-black">
              <div className="mb-2">No questionnaires assigned</div>
              <div className="text-sm">
                Add pre/post course questionnaires to collect feedback
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="border border-black rounded-lg p-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-black">
                        {assignment.questionnaireName}
                      </div>
                      <div className="text-sm text-black">
                        {assignment.timing === "pre"
                          ? "Pre-Course"
                          : "Post-Course"}{" "}
                        • {assignment.active ? "Active" : "Inactive"}
                      </div>
                    </div>
                    <button className="text-black hover:text-black border-b border-black text-sm">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Questionnaire Assignment Modal */}
      <QuestionnaireAssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        onSuccess={reloadAssignments}
        courseId={courseId}
        existingAssignments={assignments.map((a) => ({
          id: a.id,
          questionnaireId: a.questionnaireId,
          timing: a.timing,
          active: a.active,
        }))}
      />
    </div>
  );
}
