/**
 * Admin Course Detail Page
 * Comprehensive preview of course with all details, modules, and assignments
 */
"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/utils/dateUtils";

import { useAuth } from "@/app/(auth)/AuthProvider";
import { getCourseComplete } from "@/lib/api/admin";
import {
  CourseDoc,
  ModuleDoc,
  ModuleAsset,
  QuestionnaireAssignmentDoc,
} from "@/types/models";
import {
  BookOpenIcon,
  PlayIcon,
  PhotoIcon,
  DocumentIcon,
  LinkIcon,
  PencilIcon,
  ClockIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  EyeIcon,
  ArrowLeftIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
  ListBulletIcon,
  ScaleIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

// Interface for complete course data from API
interface CompleteCourseData {
  course: CourseDoc & { id: string };
  modules: (ModuleDoc & { id: string })[];
  assignments: (QuestionnaireAssignmentDoc & {
    id: string;
    questionnaire?: {
      title: string;
      purpose: string;
      questions?: unknown[];
    };
  })[];
  stats: {
    moduleCount: number;
    assignmentCount: number;
    totalAssets: number;
  };
}

export default function AdminCourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const { firebaseUser } = useAuth();

  const [courseData, setCourseData] = useState<CompleteCourseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set()
  );

  // Load complete course data
  useEffect(() => {
    const loadCourseData = async () => {
      if (!firebaseUser || !courseId) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await getCourseComplete(courseId);
        setCourseData(data);
        // Expand first module by default
        if (data.modules.length > 0) {
          setExpandedModules(new Set([data.modules[0].id]));
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load course data"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadCourseData();
  }, [firebaseUser, courseId]);

  // Toggle module expansion
  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  // Get asset icon
  const getAssetIcon = (kind: string) => {
    switch (kind) {
      case "video":
        return (
          <PlayIcon className="w-4 h-4" style={{ color: "var(--primary)" }} />
        );
      case "pdf":
        return (
          <DocumentIcon
            className="w-4 h-4"
            style={{ color: "var(--accent)" }}
          />
        );
      case "image":
        return (
          <PhotoIcon
            className="w-4 h-4"
            style={{ color: "var(--destructive)" }}
          />
        );
      case "link":
        return (
          <LinkIcon className="w-4 h-4" style={{ color: "var(--secondary)" }} />
        );
      default:
        return (
          <DocumentTextIcon
            className="w-4 h-4"
            style={{ color: "var(--secondary)" }}
          />
        );
    }
  };

  // Get questionnaire type icon
  const getQuestionnaireTypeIcon = (purpose?: string) => {
    switch (purpose) {
      case "quiz":
        return (
          <CheckCircleIcon
            className="w-5 h-5"
            style={{ color: "var(--primary)" }}
          />
        );
      case "survey":
        return (
          <ListBulletIcon
            className="w-5 h-5"
            style={{ color: "var(--accent)" }}
          />
        );
      case "assessment":
        return (
          <ScaleIcon
            className="w-5 h-5"
            style={{ color: "var(--destructive)" }}
          />
        );
      default:
        return (
          <ChatBubbleLeftRightIcon
            className="w-5 h-5"
            style={{ color: "var(--secondary)" }}
          />
        );
    }
  };

  // Format duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="animate-pulse">
          <div
            className="h-8 rounded mb-6"
            style={{ backgroundColor: "var(--secondary-10)" }}
          ></div>
          <div
            className="h-80 rounded-2xl mb-8"
            style={{ backgroundColor: "var(--secondary-10)" }}
          ></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl"
                style={{ backgroundColor: "var(--secondary-10)" }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div
          className="rounded-xl p-6 text-center"
          style={{
            backgroundColor: "var(--destructive-10)",
            border: "1px solid var(--destructive-20)",
          }}
        >
          <div className="text-xl mb-2" style={{ color: "var(--destructive)" }}>
            Error
          </div>
          <p style={{ color: "var(--secondary-70)" }}>{error}</p>
          <Link
            href="/admin/courses"
            className="inline-flex items-center mt-4 px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: "var(--secondary)",
              color: "var(--secondary-foreground)",
              boxShadow:
                "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--secondary-90)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--secondary)";
            }}
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center py-12">
          <p className="text-secondary/70">Course not found</p>
        </div>
      </div>
    );
  }

  const { course, modules, assignments, stats } = courseData;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/courses"
            className="flex items-center space-x-2 transition-colors"
            style={{ color: "var(--secondary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--secondary)";
            }}
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Back to Courses</span>
          </Link>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href={`/admin/courses/${courseId}/edit`}
            className="px-4 py-2 rounded-lg transition-colors duration-150 flex items-center space-x-2"
            style={{
              backgroundColor: "var(--card)",
              color: "var(--secondary)",
              border: "1px solid var(--secondary-15)",
              boxShadow:
                "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--secondary-5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--card)";
            }}
          >
            <PencilIcon className="w-4 h-4" />
            <span>Edit Course</span>
          </Link>
          {course.published ? (
            <div
              className="px-4 py-2 rounded-lg flex items-center space-x-2"
              style={{
                backgroundColor: "var(--accent)",
                color: "var(--secondary)",
                boxShadow:
                  "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
              }}
            >
              <RocketLaunchIcon className="w-4 h-4" />
              <span>Published</span>
            </div>
          ) : (
            <div
              className="px-4 py-2 rounded-lg flex items-center space-x-2"
              style={{
                backgroundColor: "var(--secondary-10)",
                color: "var(--secondary)",
                border: "1px solid var(--secondary-15)",
                boxShadow:
                  "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
              }}
            >
              <EyeIcon className="w-4 h-4" />
              <span>Draft</span>
            </div>
          )}
        </div>
      </div>

      {/* Course Header Section */}
      <section className="mb-12">
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: "var(--card)",
            boxShadow:
              "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
          }}
        >
          <div className="h-80 overflow-hidden relative">
            {course.heroImageUrl ? (
              <Image
                src={course.heroImageUrl}
                alt={`${course.title} banner`}
                fill
                className="object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(to bottom right, var(--primary-10), var(--accent-10), var(--secondary-10))",
                }}
              >
                <BookOpenIcon
                  className="w-24 h-24"
                  style={{ color: "var(--secondary-50)" }}
                />
              </div>
            )}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, var(--secondary-75), var(--secondary-50), transparent)",
              }}
            ></div>
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <div className="flex items-center space-x-2 mb-3">
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium capitalize"
                  style={{
                    backgroundColor: "var(--accent)",
                    color: "var(--secondary)",
                  }}
                >
                  {course.level || "General"}
                </span>
                {course.published && (
                  <span
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: "var(--primary-10)",
                      color: "white",
                    }}
                  >
                    Published
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-bold mb-3">{course.title}</h1>
              <p className="text-xl text-white/90 max-w-3xl">
                {course.description || "No description available"}
              </p>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="text-center">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: "var(--primary-10)" }}
                >
                  <ClockIcon
                    className="text-xl w-6 h-6"
                    style={{ color: "var(--primary)" }}
                  />
                </div>
                <p
                  className="text-2xl font-bold"
                  style={{ color: "var(--secondary)" }}
                >
                  {formatDuration(course.durationMinutes || 0)}
                </p>
                <p className="text-sm" style={{ color: "var(--secondary-70)" }}>
                  Total Duration
                </p>
              </div>
              <div className="text-center">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: "var(--accent-10)" }}
                >
                  <BookOpenIcon
                    className="text-xl w-6 h-6"
                    style={{ color: "var(--accent)" }}
                  />
                </div>
                <p
                  className="text-2xl font-bold"
                  style={{ color: "var(--secondary)" }}
                >
                  {stats.moduleCount}
                </p>
                <p className="text-sm" style={{ color: "var(--secondary-70)" }}>
                  Learning Modules
                </p>
              </div>
              <div className="text-center">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: "var(--destructive-10)" }}
                >
                  <DocumentTextIcon
                    className="text-xl w-6 h-6"
                    style={{ color: "var(--destructive)" }}
                  />
                </div>
                <p
                  className="text-2xl font-bold"
                  style={{ color: "var(--secondary)" }}
                >
                  {stats.assignmentCount}
                </p>
                <p className="text-sm" style={{ color: "var(--secondary-70)" }}>
                  Assignments
                </p>
              </div>
              <div className="text-center">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: "var(--primary-10)" }}
                >
                  <AcademicCapIcon
                    className="text-xl w-6 h-6"
                    style={{ color: "var(--primary)" }}
                  />
                </div>
                <p
                  className="text-2xl font-bold"
                  style={{ color: "var(--secondary)" }}
                >
                  {course.level
                    ? course.level.charAt(0).toUpperCase() +
                      course.level.slice(1)
                    : "General"}
                </p>
                <p className="text-sm" style={{ color: "var(--secondary-70)" }}>
                  Difficulty Level
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Description & Metadata */}
      <section className="mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Description */}
          <div className="lg:col-span-2">
            <div
              className="rounded-2xl p-8"
              style={{
                backgroundColor: "var(--card)",
                boxShadow:
                  "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
              }}
            >
              <h2
                className="text-2xl font-bold mb-6"
                style={{ color: "var(--secondary)" }}
              >
                Course Description
              </h2>
              <div className="prose prose-lg max-w-none">
                <p
                  className="leading-relaxed"
                  style={{ color: "var(--secondary-70)" }}
                >
                  {course.description ||
                    "No detailed description available for this course."}
                </p>
              </div>
            </div>
          </div>

          {/* Course Metadata Sidebar */}
          <div className="space-y-6">
            {/* Course Details */}
            <div
              className="rounded-2xl p-6"
              style={{
                backgroundColor: "var(--card)",
                boxShadow:
                  "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
              }}
            >
              <h3
                className="text-lg font-semibold mb-4"
                style={{ color: "var(--secondary)" }}
              >
                Course Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span style={{ color: "var(--secondary-70)" }}>
                    Difficulty
                  </span>
                  <span
                    className="font-medium px-2 py-1 rounded"
                    style={{
                      backgroundColor:
                        course.level === "beginner"
                          ? "var(--primary-10)"
                          : course.level === "intermediate"
                          ? "var(--accent-10)"
                          : course.level === "advanced"
                          ? "var(--destructive-10)"
                          : "var(--secondary-10)",
                      color:
                        course.level === "beginner"
                          ? "var(--primary)"
                          : course.level === "intermediate"
                          ? "var(--accent)"
                          : course.level === "advanced"
                          ? "var(--destructive)"
                          : "var(--secondary)",
                      border: `1px solid ${
                        course.level === "beginner"
                          ? "var(--primary-10)"
                          : course.level === "intermediate"
                          ? "var(--accent-10)"
                          : course.level === "advanced"
                          ? "var(--destructive-10)"
                          : "var(--secondary-10)"
                      }`,
                    }}
                  >
                    {course.level
                      ? course.level.charAt(0).toUpperCase() +
                        course.level.slice(1)
                      : "General"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: "var(--secondary-70)" }}>Status</span>
                  <span
                    className="font-medium"
                    style={{
                      color: course.published
                        ? "var(--primary)"
                        : "var(--secondary-70)",
                    }}
                  >
                    {course.published ? "Published" : "Draft"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: "var(--secondary-70)" }}>
                    Last Updated
                  </span>
                  <span
                    className="font-medium"
                    style={{ color: "var(--secondary)" }}
                  >
                    {course.updatedAt ? formatDate(course.updatedAt) : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Curriculum Overview */}
      <section className="mb-12">
        <div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: "var(--card)",
            boxShadow:
              "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
          }}
        >
          <div className="flex items-center justify-between mb-8">
            <h2
              className="text-2xl font-bold"
              style={{ color: "var(--secondary)" }}
            >
              Course Curriculum
            </h2>
            <div style={{ color: "var(--secondary-70)" }}>
              <span className="font-medium">{stats.moduleCount} Modules</span> •
              <span className="font-medium ml-1">
                {formatDuration(course.durationMinutes || 0)}
              </span>{" "}
              •
              <span className="font-medium ml-1">
                {stats.totalAssets} Assets
              </span>
            </div>
          </div>

          {/* Module List */}
          <div className="space-y-4">
            {modules.length === 0 ? (
              <div
                className="text-center py-12 rounded-xl"
                style={{ backgroundColor: "var(--secondary-5)" }}
              >
                <BookOpenIcon
                  className="w-16 h-16 mx-auto mb-4"
                  style={{ color: "var(--secondary-50)" }}
                />
                <h3
                  className="text-lg font-medium mb-2"
                  style={{ color: "var(--secondary)" }}
                >
                  No modules yet
                </h3>
                <p className="mb-4" style={{ color: "var(--secondary-60)" }}>
                  Add modules to your course to get started
                </p>
                <Link
                  href={`/admin/courses/${courseId}/modules`}
                  className="inline-flex items-center px-4 py-2 rounded-lg transition-colors"
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "white",
                    boxShadow:
                      "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--primary-90)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--primary)";
                  }}
                >
                  <PencilIcon className="w-4 h-4 mr-2" />
                  Add Modules
                </Link>
              </div>
            ) : (
              modules.map((module, index) => (
                <div
                  key={module.id}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--secondary-15)",
                    boxShadow:
                      "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
                  }}
                >
                  <div
                    className="p-6"
                    style={{
                      backgroundColor: expandedModules.has(module.id)
                        ? "var(--primary-10)"
                        : "transparent",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: "var(--primary)" }}
                        >
                          <span
                            className="font-bold"
                            style={{ color: "var(--primary-foreground)" }}
                          >
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <h3
                            className="text-lg font-semibold"
                            style={{ color: "var(--secondary)" }}
                          >
                            {module.title}
                          </h3>
                          <p style={{ color: "var(--secondary-70)" }}>
                            {module.summary || "No summary available"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span
                          className="text-sm"
                          style={{ color: "var(--secondary-70)" }}
                        >
                          {module.estMinutes
                            ? formatDuration(module.estMinutes)
                            : "No duration"}{" "}
                          • {module.assets?.length || 0} assets
                        </span>
                        <button
                          onClick={() => toggleModule(module.id)}
                          className="p-2 rounded-lg transition-colors"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "var(--secondary-5)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }}
                        >
                          {expandedModules.has(module.id) ? (
                            <ChevronDownIcon
                              className="w-5 h-5"
                              style={{ color: "var(--secondary-50)" }}
                            />
                          ) : (
                            <ChevronRightIcon
                              className="w-5 h-5"
                              style={{ color: "var(--secondary-50)" }}
                            />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {expandedModules.has(module.id) && (
                    <div
                      className="p-6 space-y-4"
                      style={{ borderTop: "1px solid var(--secondary-10)" }}
                    >
                      {/* Module content info */}
                      {module.contentType && (
                        <div
                          className="rounded-lg p-4"
                          style={{ backgroundColor: "var(--secondary-5)" }}
                        >
                          <h4
                            className="font-medium mb-2"
                            style={{ color: "var(--secondary)" }}
                          >
                            Primary Content
                          </h4>
                          <div className="flex items-center space-x-3">
                            {getAssetIcon(module.contentType)}
                            <span
                              className="capitalize"
                              style={{ color: "var(--secondary-70)" }}
                            >
                              {module.contentType}
                            </span>
                            {module.contentType === "text" && module.body && (
                              <span
                                className="text-sm"
                                style={{ color: "var(--secondary-50)" }}
                              >
                                ({module.body.length} characters)
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Module assets */}
                      {module.assets && module.assets.length > 0 ? (
                        <div>
                          <h4
                            className="font-medium mb-3"
                            style={{ color: "var(--secondary)" }}
                          >
                            Module Assets
                          </h4>
                          <div className="space-y-2">
                            {module.assets
                              .sort((a, b) => (a.order || 0) - (b.order || 0))
                              .map((asset: ModuleAsset) => (
                                <div
                                  key={asset.id}
                                  className="flex items-center space-x-4 p-3 rounded-lg transition-colors duration-150"
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      "var(--secondary-5)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      "transparent";
                                  }}
                                >
                                  <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{
                                      backgroundColor: "var(--secondary-10)",
                                    }}
                                  >
                                    {getAssetIcon(asset.kind)}
                                  </div>
                                  <div className="flex-1">
                                    <p
                                      className="font-medium"
                                      style={{ color: "var(--secondary)" }}
                                    >
                                      {asset.title || "Untitled Asset"}
                                    </p>
                                    <p
                                      className="text-sm capitalize"
                                      style={{ color: "var(--secondary-70)" }}
                                    >
                                      {asset.kind} asset
                                    </p>
                                  </div>
                                  {asset.url && (
                                    <a
                                      href={asset.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm transition-colors"
                                      style={{ color: "var(--primary)" }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.color =
                                          "var(--primary-80)";
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.color =
                                          "var(--primary)";
                                      }}
                                    >
                                      View
                                    </a>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      ) : (
                        <div
                          className="text-center py-6"
                          style={{ color: "var(--secondary-50)" }}
                        >
                          <DocumentIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No assets in this module</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Questionnaire Assignments */}
      {assignments.length > 0 && (
        <section className="mb-12">
          <div
            className="rounded-2xl p-8"
            style={{
              backgroundColor: "var(--card)",
              boxShadow:
                "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
            }}
          >
            <h2
              className="text-2xl font-bold mb-6"
              style={{ color: "var(--secondary)" }}
            >
              Course Assessments
            </h2>
            <div className="grid gap-4">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="rounded-xl p-6"
                  style={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--secondary-15)",
                    boxShadow:
                      "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: "var(--secondary-10)" }}
                      >
                        {getQuestionnaireTypeIcon(
                          assignment.questionnaire?.purpose
                        )}
                      </div>
                      <div>
                        <h3
                          className="font-semibold mb-1"
                          style={{ color: "var(--secondary)" }}
                        >
                          {assignment.questionnaire?.title ||
                            "Untitled Questionnaire"}
                        </h3>
                        <div
                          className="flex items-center space-x-4 text-sm"
                          style={{ color: "var(--secondary-70)" }}
                        >
                          <span className="capitalize">
                            {assignment.scope.type} • {assignment.timing}
                          </span>
                          <span className="capitalize">
                            {assignment.questionnaire?.purpose || "assessment"}
                          </span>
                          {assignment.questionnaire?.questions && (
                            <span>
                              {assignment.questionnaire.questions.length}{" "}
                              questions
                            </span>
                          )}
                        </div>
                        {assignment.scope.moduleId && (
                          <p
                            className="text-sm mt-1"
                            style={{ color: "var(--secondary-60)" }}
                          >
                            Assigned to:{" "}
                            {modules.find(
                              (m) => m.id === assignment.scope.moduleId
                            )?.title || "Unknown Module"}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor: assignment.active
                            ? "var(--primary-10)"
                            : "var(--secondary-10)",
                          color: assignment.active
                            ? "var(--primary)"
                            : "var(--secondary-70)",
                        }}
                      >
                        {assignment.active ? "Active" : "Inactive"}
                      </span>
                      <Link
                        href={`/admin/questionnaires/${assignment.questionnaireId}`}
                        className="text-sm font-medium transition-colors"
                        style={{ color: "var(--primary)" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "var(--primary-80)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "var(--primary)";
                        }}
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
