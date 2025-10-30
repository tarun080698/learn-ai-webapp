"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/app/(auth)/AuthProvider";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";
import { AdminCourse, CourseStats } from "@/types/admin";
import { CourseDoc } from "@/types/models";
import { calculateCompletionRate } from "@/utils/helper";
import { formatDate } from "@/utils/dateUtils";
import { generateIdempotencyKey } from "@/utils/uuid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBook,
  faUsers,
  faTrophy,
  faPlus,
  faEdit,
  faEye,
  faArchive,
  faSearch,
  faSpinner,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";

// Loading skeleton components
function StatCardSkeleton() {
  return (
    <div
      className="rounded-2xl p-6 animate-pulse"
      style={{
        backgroundColor: "var(--card)",
        boxShadow:
          "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className="p-3 rounded-xl"
          style={{ backgroundColor: "var(--secondary-10)" }}
        >
          <div className="w-6 h-6 bg-gray-300 rounded"></div>
        </div>
        <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        <div className="h-8 bg-gray-300 rounded w-1/3"></div>
        <div className="h-4 bg-gray-300 rounded w-1/4"></div>
      </div>
    </div>
  );
}

function CourseCardSkeleton() {
  return (
    <div
      className="rounded-2xl overflow-hidden animate-pulse"
      style={{
        backgroundColor: "var(--card)",
        boxShadow:
          "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
      }}
    >
      <div className="h-48 bg-gray-300"></div>
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="h-6 bg-gray-300 rounded w-3/4"></div>
          <div className="h-6 bg-gray-300 rounded w-16"></div>
        </div>
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-300 rounded w-1/3"></div>
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
          </div>
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/3"></div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
            <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
            <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
          </div>
          <div className="h-8 bg-gray-300 rounded-lg w-20"></div>
        </div>
      </div>
    </div>
  );
}

// Confirmation modal component
function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  confirmStyle = "primary",
  isLoading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  confirmStyle?: "primary" | "destructive";
  isLoading?: boolean;
}) {
  if (!isOpen) return null;

  const buttonStyle =
    confirmStyle === "destructive"
      ? {
          backgroundColor: "var(--destructive)",
          color: "var(--destructive-foreground)",
        }
      : {
          backgroundColor: "var(--primary)",
          color: "var(--primary-foreground)",
        };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div
        className="rounded-2xl p-6 max-w-md w-full mx-4"
        style={{ backgroundColor: "var(--card)" }}
      >
        <h3
          className="text-lg font-semibold mb-4"
          style={{ color: "var(--secondary)" }}
        >
          {title}
        </h3>
        <p className="mb-6" style={{ color: "var(--secondary-70)" }}>
          {message}
        </p>
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg font-medium transition-colors duration-150"
            style={{
              backgroundColor: "var(--card)",
              color: "var(--secondary)",
              border: "1px solid var(--secondary-15)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg font-medium transition-colors duration-150 flex items-center space-x-2"
            style={buttonStyle}
          >
            {isLoading && (
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            )}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Toast notification component
function Toast({
  message,
  type = "success",
  onClose,
}: {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
}) {
  const borderColor =
    type === "success" ? "var(--accent)" : "var(--destructive)";

  useEffect(() => {
    if (type === "success") {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [type, onClose]);

  return (
    <div
      className="fixed top-4 right-4 rounded-lg p-4 shadow-lg z-50 min-w-80"
      style={{
        backgroundColor: "var(--background)",
        borderLeft: `4px solid ${borderColor}`,
      }}
    >
      <div className="flex items-center justify-between">
        <p style={{ color: "var(--secondary)" }}>{message}</p>
        <button
          onClick={onClose}
          className="ml-4"
          style={{ color: "var(--secondary-50)" }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { firebaseUser: user, role, loading: authLoading } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();

  const [mounted, setMounted] = useState(false);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [stats, setStats] = useState<CourseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "publish" | "archive";
    courseId: string;
    courseName: string;
    newState: boolean;
  }>({
    isOpen: false,
    type: "publish",
    courseId: "",
    courseName: "",
    newState: false,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Prevent hydration mismatch by ensuring client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check admin access
  useEffect(() => {
    if (!authLoading && user) {
      if (role !== "admin") {
        window.location.href = "/admin/login";
        return;
      }
    } else if (!authLoading && !user) {
      window.location.href = "/admin/login";
      return;
    }
  }, [user, role, authLoading]);

  // Fetch courses data
  useEffect(() => {
    if (!user || authLoading) return;

    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await authenticatedFetch("/api/admin/courses.mine");

        if (!response.ok) {
          throw new Error("Failed to fetch courses");
        }

        const apiResponse = await response.json();
        console.log({ apiResponse });

        // Convert CourseDoc to AdminCourse format
        const adminCourses: AdminCourse[] = apiResponse.courses.map(
          (course: CourseDoc & { id: string }) => ({
            id: course.id,
            title: course.title,
            description: course.description,
            heroImageUrl: course.heroImageUrl,
            published: course.published,
            archived: course.archived,
            updatedAt: course.updatedAt,
            moduleCount: course.moduleCount || 0,
            enrolledCount: course.enrolledCount || 0,
            completedCount: course.completedCount || 0,
          })
        );

        setCourses(adminCourses);

        // Calculate stats
        const totalEnrollments = adminCourses.reduce(
          (sum, course) => sum + course.enrolledCount,
          0
        );
        const totalCompletions = adminCourses.reduce(
          (sum, course) => sum + course.completedCount,
          0
        );

        setStats({
          totalCourses: adminCourses.length,
          totalEnrollments,
          totalCompletions,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load courses");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user, authLoading, authenticatedFetch]);

  // Filter courses based on search
  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle publish/unpublish
  const handlePublishToggle = async (
    courseId: string,
    currentPublished: boolean
  ) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    setConfirmModal({
      isOpen: true,
      type: "publish",
      courseId,
      courseName: course.title,
      newState: !currentPublished,
    });
  };

  // Handle archive/restore
  const handleArchiveToggle = async (
    courseId: string,
    currentArchived: boolean
  ) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    setConfirmModal({
      isOpen: true,
      type: "archive",
      courseId,
      courseName: course.title,
      newState: !currentArchived,
    });
  };

  // Execute confirmation action
  const executeAction = async () => {
    if (!confirmModal.isOpen) return;

    setActionLoading(confirmModal.courseId);
    try {
      const endpoint =
        confirmModal.type === "publish"
          ? "/api/admin/course.publish"
          : "/api/admin/course.archive";

      const body =
        confirmModal.type === "publish"
          ? {
              courseId: confirmModal.courseId,
              published: confirmModal.newState,
            }
          : {
              courseId: confirmModal.courseId,
              archived: confirmModal.newState,
            };

      const response = await authenticatedFetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": generateIdempotencyKey(),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${confirmModal.type} course`);
      }

      // Update local state
      setCourses((prev) =>
        prev.map((course) =>
          course.id === confirmModal.courseId
            ? {
                ...course,
                [confirmModal.type === "publish" ? "published" : "archived"]:
                  confirmModal.newState,
              }
            : course
        )
      );

      setToast({
        message: `Course ${
          confirmModal.type === "publish"
            ? confirmModal.newState
              ? "published"
              : "unpublished"
            : confirmModal.newState
            ? "archived"
            : "restored"
        } successfully`,
        type: "success",
      });
    } catch (err) {
      setToast({
        message:
          err instanceof Error
            ? err.message
            : `Failed to ${confirmModal.type} course`,
        type: "error",
      });
    } finally {
      setActionLoading(null);
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    }
  };

  // Course card component
  function CourseCard({ course }: { course: AdminCourse }) {
    const completionRate = calculateCompletionRate(
      course.completedCount,
      course.enrolledCount
    );

    // Status chip
    let statusChip;
    if (course.archived) {
      statusChip = (
        <span
          className="text-xs font-medium px-2 py-1 rounded-lg border"
          style={{
            backgroundColor: "var(--secondary-20)",
            color: "var(--secondary-70)",
            borderColor: "var(--secondary-15)",
          }}
        >
          Archived
        </span>
      );
    } else if (course.published) {
      statusChip = (
        <span
          className="text-xs font-medium px-2 py-1 rounded-lg"
          style={{
            backgroundColor: "var(--accent)",
            color: "var(--secondary)",
          }}
        >
          Published
        </span>
      );
    } else {
      statusChip = (
        <span
          className="text-xs font-medium px-2 py-1 rounded-lg"
          style={{
            backgroundColor: "var(--accent)",
            color: "var(--secondary)",
          }}
        >
          Draft
        </span>
      );
    }

    return (
      <div
        className="rounded-2xl overflow-hidden transition-all duration-150 hover:scale-[1.02]"
        style={{
          backgroundColor: "var(--card)",
          boxShadow:
            "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow =
            "0 1px 2px rgba(38,70,83,0.06), 0 8px 32px rgba(38,70,83,0.12)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow =
            "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)";
        }}
      >
        <div className="h-48 overflow-hidden">
          {course.heroImageUrl ? (
            <Image
              className="w-full h-full object-cover"
              src={course.heroImageUrl}
              alt={`${course.title} thumbnail`}
              width={300}
              height={192}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                backgroundColor: "var(--background)",
                border: "1px solid var(--secondary-15)",
              }}
            >
              <FontAwesomeIcon
                icon={faBook}
                className="text-4xl"
                style={{ color: "var(--secondary)" }}
              />
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h3
              className="text-lg font-semibold line-clamp-2"
              style={{ color: "var(--secondary)" }}
            >
              {course.title}
            </h3>
            {statusChip}
          </div>
          <div className="space-y-3 mb-4">
            <div
              className="flex items-center justify-between "
              style={{ color: "var(--secondary-70)" }}
            >
              {/* <div>Created at: {formatDate(course.)}</div> */}
              <div>Updated: {formatDate(course.updatedAt)}</div>
              <span>{course.moduleCount} modules</span>
            </div>
            <div
              className="flex items-center justify-between "
              style={{ color: "var(--secondary-70)" }}
            >
              <span>{course.enrolledCount} enrolled</span>
              <span>
                {course.enrolledCount > 0
                  ? `${completionRate}% completion`
                  : "-"}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Link href={`/admin/courses/${course.id}/edit`}>
                <button
                  className="p-2 rounded-lg transition-colors duration-150"
                  title="Edit"
                  style={{ color: "var(--secondary)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--primary)";
                    e.currentTarget.style.backgroundColor = "var(--primary-10)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--secondary)";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <FontAwesomeIcon icon={faEdit} className="" />
                </button>
              </Link>
              <Link href={`/admin/courses/${course.id}`}>
                <button
                  className="p-2 rounded-lg transition-colors duration-150"
                  title="Preview"
                  style={{ color: "var(--secondary)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--accent)";
                    e.currentTarget.style.backgroundColor = "var(--accent-10)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--secondary)";
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <FontAwesomeIcon icon={faEye} className="" />
                </button>
              </Link>
              <button
                onClick={() => handleArchiveToggle(course.id, course.archived)}
                disabled={actionLoading === course.id}
                className="p-2 rounded-lg transition-colors duration-150"
                title={course.archived ? "Restore" : "Archive"}
                style={{ color: "var(--secondary)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--destructive)";
                  e.currentTarget.style.backgroundColor =
                    "var(--destructive-10)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--secondary)";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <FontAwesomeIcon icon={faArchive} className="" />
              </button>
            </div>
            {!course.archived && (
              <button
                onClick={() => handlePublishToggle(course.id, course.published)}
                disabled={actionLoading === course.id}
                className="px-3 py-1.5 rounded-lg  font-medium transition-colors duration-150"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-foreground)",
                }}
              >
                {actionLoading === course.id ? (
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                ) : course.published ? (
                  "Unpublish"
                ) : (
                  "Publish"
                )}
              </button>
            )}
            {course.archived && (
              <button
                onClick={() => handleArchiveToggle(course.id, course.archived)}
                disabled={actionLoading === course.id}
                className="px-3 py-1.5 rounded-lg  font-medium transition-colors duration-150"
                style={{
                  backgroundColor: "var(--card)",
                  color: "var(--secondary)",
                  border: "1px solid var(--secondary-15)",
                }}
              >
                {actionLoading === course.id ? (
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                ) : (
                  "Restore"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Prevent hydration mismatch - show loading until mounted
  if (!mounted || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div
      style={{ backgroundColor: "var(--background)" }}
      className="min-h-screen "
    >
      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Dashboard Header */}
        <section className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1
                className="text-3xl font-bold mb-2"
                style={{ color: "var(--secondary)" }}
              >
                Dashboard Overview
              </h1>
              <p className="text-lg" style={{ color: "var(--secondary-75)" }}>
                Monitor your courses, enrollments, and student progress
              </p>
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <Link href="/admin/courses/new">
                <button
                  className="px-6 py-3 rounded-xl font-medium transition-colors duration-150 flex items-center space-x-2"
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "var(--primary-foreground)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--primary-90)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--primary)";
                  }}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  <span>Create Course</span>
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Cards Row */}
        <section className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading || !stats ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                {/* Total Courses Card */}
                <div
                  className="rounded-2xl p-6 transition-shadow duration-150"
                  style={{
                    backgroundColor: "var(--card)",
                    boxShadow:
                      "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 1px 2px rgba(38,70,83,0.06), 0 8px 32px rgba(38,70,83,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)";
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="p-3 rounded-xl"
                      style={{ backgroundColor: "var(--primary-10)" }}
                    >
                      <FontAwesomeIcon
                        icon={faBook}
                        className="text-xl"
                        style={{ color: "var(--primary)" }}
                      />
                    </div>
                    <div
                      className="w-12 h-1 rounded-full"
                      style={{ backgroundColor: "var(--accent)" }}
                    ></div>
                  </div>
                  <div className="space-y-2">
                    <h3
                      className=" font-medium uppercase tracking-wide"
                      style={{ color: "var(--secondary-70)" }}
                    >
                      Total Courses
                    </h3>
                    <p
                      className="text-4xl font-bold"
                      style={{ color: "var(--secondary)" }}
                    >
                      {stats.totalCourses}
                    </p>
                    <div className="flex items-center space-x-2 ">
                      <span style={{ color: "var(--secondary-70)" }}>
                        owner total
                      </span>
                    </div>
                  </div>
                </div>

                {/* Total Enrollments Card */}
                <div
                  className="rounded-2xl p-6 transition-shadow duration-150"
                  style={{
                    backgroundColor: "var(--card)",
                    boxShadow:
                      "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 1px 2px rgba(38,70,83,0.06), 0 8px 32px rgba(38,70,83,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)";
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="p-3 rounded-xl"
                      style={{ backgroundColor: "var(--accent-10)" }}
                    >
                      <FontAwesomeIcon
                        icon={faUsers}
                        className="text-xl"
                        style={{ color: "var(--accent)" }}
                      />
                    </div>
                    <div
                      className="w-12 h-1 rounded-full"
                      style={{ backgroundColor: "var(--accent)" }}
                    ></div>
                  </div>
                  <div className="space-y-2">
                    <h3
                      className=" font-medium uppercase tracking-wide"
                      style={{ color: "var(--secondary-70)" }}
                    >
                      Total Enrollments
                    </h3>
                    <p
                      className="text-4xl font-bold"
                      style={{ color: "var(--secondary)" }}
                    >
                      {stats.totalEnrollments.toLocaleString()}
                    </p>
                    <div className="flex items-center space-x-2 ">
                      <span style={{ color: "var(--secondary-70)" }}>
                        owner total
                      </span>
                    </div>
                  </div>
                </div>

                {/* Total Completions Card */}
                <div
                  className="rounded-2xl p-6 transition-shadow duration-150"
                  style={{
                    backgroundColor: "var(--card)",
                    boxShadow:
                      "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 1px 2px rgba(38,70,83,0.06), 0 8px 32px rgba(38,70,83,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)";
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="p-3 rounded-xl"
                      style={{ backgroundColor: "var(--primary-10)" }}
                    >
                      <FontAwesomeIcon
                        icon={faTrophy}
                        className="text-xl"
                        style={{ color: "var(--primary)" }}
                      />
                    </div>
                    <div
                      className="w-12 h-1 rounded-full"
                      style={{ backgroundColor: "var(--accent)" }}
                    ></div>
                  </div>
                  <div className="space-y-2">
                    <h3
                      className=" font-medium uppercase tracking-wide"
                      style={{ color: "var(--secondary-70)" }}
                    >
                      Total Completions
                    </h3>
                    <p
                      className="text-4xl font-bold"
                      style={{ color: "var(--secondary)" }}
                    >
                      {stats.totalCompletions.toLocaleString()}
                    </p>
                    <div className="flex items-center space-x-2 ">
                      <span style={{ color: "var(--secondary-70)" }}>
                        owner total
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Courses Grid */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2
              className="text-2xl font-bold"
              style={{ color: "var(--secondary)" }}
            >
              Course Management
            </h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-lg px-4 py-2 pl-10 w-80 focus:outline-none focus:ring-2 transition-all duration-150"
                  style={{
                    backgroundColor: "var(--input)",
                    border: "1px solid var(--secondary-15)",
                    color: "var(--secondary)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--primary)";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 2px var(--primary-10)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--secondary-15)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2"
                  style={{ color: "var(--secondary-50)" }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-2xl font-bold"
              style={{ color: "var(--secondary)" }}
            >
              Your Courses
            </h2>
            <div
              className="flex items-center space-x-2 "
              style={{ color: "var(--secondary-70)" }}
            >
              <span>Showing {filteredCourses.length} courses</span>
            </div>
          </div>

          {error && (
            <div
              className="rounded-lg p-4 mb-6 flex items-center space-x-3"
              style={{
                backgroundColor: "var(--background)",
                border: "1px solid var(--destructive)",
                borderLeft: "4px solid var(--destructive)",
              }}
            >
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                style={{ color: "var(--destructive)" }}
              />
              <span style={{ color: "var(--secondary)" }}>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <CourseCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-16">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{
                  backgroundColor: "var(--secondary-10)",
                }}
              >
                <FontAwesomeIcon
                  icon={faBook}
                  className="text-2xl"
                  style={{ color: "var(--secondary)" }}
                />
              </div>
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: "var(--secondary)" }}
              >
                {courses.length === 0
                  ? "Create your first course"
                  : "No courses found"}
              </h3>
              <p className="mb-6" style={{ color: "var(--secondary-70)" }}>
                {courses.length === 0
                  ? "Get started by creating your first course"
                  : "Try adjusting your search terms"}
              </p>
              {courses.length === 0 && (
                <Link href="/admin/courses/new">
                  <button
                    className="px-6 py-3 rounded-lg font-medium transition-colors duration-150"
                    style={{
                      backgroundColor: "var(--primary)",
                      color: "var(--primary-foreground)",
                    }}
                  >
                    Create Course
                  </button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={executeAction}
        title={`${
          confirmModal.type === "publish"
            ? confirmModal.newState
              ? "Publish"
              : "Unpublish"
            : confirmModal.newState
            ? "Archive"
            : "Restore"
        } Course`}
        message={`Are you sure you want to ${
          confirmModal.type === "publish"
            ? confirmModal.newState
              ? "publish"
              : "unpublish"
            : confirmModal.newState
            ? "archive"
            : "restore"
        } "${confirmModal.courseName}"?`}
        confirmText={
          confirmModal.type === "publish"
            ? confirmModal.newState
              ? "Publish"
              : "Unpublish"
            : confirmModal.newState
            ? "Archive"
            : "Restore"
        }
        confirmStyle={
          confirmModal.type === "archive" && confirmModal.newState
            ? "destructive"
            : "primary"
        }
        isLoading={!!actionLoading}
      />

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
