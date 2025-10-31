"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { PublicLayout } from "@/components/PublicLayout";
import Link from "next/link";
import { useAuth } from "@/app/(auth)/AuthProvider";
import { generateIdempotencyKey } from "@/utils/uuid";

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

interface Course {
  id: string;
  title: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  durationMinutes: number;
  moduleCount?: number;
  modules: Module[];
  heroImageUrl?: string;
  published: boolean;
  createdAt: string;
  rating?: number;
  reviewCount?: number;
  studentCount?: number;
  instructor?: {
    name: string;
    title: string;
    bio: string;
    avatar: string;
    rating: number;
    studentCount: number;
    courseCount: number;
  };
  enrollment?: {
    status: "enrolled" | null;
    enrolledAt?: string;
  };
}

export default function CourseDetailsPage() {
  const params = useParams();
  const courseId = params?.courseId as string;
  const { firebaseUser } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "section-1",
  ]);

  useEffect(() => {
    if (courseId) {
      fetchCourseDetails();
    }
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const headers: Record<string, string> = {};

      if (firebaseUser) {
        headers.Authorization = `Bearer ${await firebaseUser.getIdToken()}`;
      }

      const response = await fetch(`/api/courses/${courseId}`, { headers });

      if (!response.ok) {
        throw new Error("Course not found");
      }

      const data = await response.json();
      setCourse(data.course);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Group modules into sections (every 5 modules)
  const groupModulesIntoSections = (modules: Module[]) => {
    const sections = [];
    const moduleGroups = [];

    for (let i = 0; i < modules.length; i += 5) {
      moduleGroups.push(modules.slice(i, i + 5));
    }

    moduleGroups.forEach((group, index) => {
      const totalDuration = group.reduce(
        (sum, module) => sum + module.estMinutes,
        0
      );
      sections.push({
        id: `section-${index + 1}`,
        title: `Section ${index + 1}: ${group[0]?.title || "Course Content"}`,
        modules: group,
        totalDuration,
      });
    });

    return sections;
  };

  if (loading) {
    return (
      <PublicLayout showPromoBanner={false}>
        <div className="container mx-auto px-4 py-20 text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
            style={{ borderColor: "var(--primary)" }}
          ></div>
          <p className="mt-4" style={{ color: "var(--muted-foreground)" }}>
            Loading course details...
          </p>
        </div>
      </PublicLayout>
    );
  }

  if (error || !course) {
    return (
      <PublicLayout showPromoBanner={false}>
        <div className="container mx-auto px-4 py-20 text-center">
          <div
            className="w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "var(--muted)" }}
          >
            <span className="text-3xl">❌</span>
          </div>
          <h3
            className="text-lg font-semibold mb-2"
            style={{ color: "var(--secondary)" }}
          >
            Course Not Found
          </h3>
          <p className="mb-4" style={{ color: "var(--muted-foreground)" }}>
            {error ||
              "The course you're looking for doesn't exist or has been removed."}
          </p>
          <Link
            href="/catalog"
            className="inline-block px-6 py-3 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            Browse All Courses
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const sections = groupModulesIntoSections(course.modules || []);

  return (
    <PublicLayout showPromoBanner={false}>
      {/* Breadcrumb Navigation */}
      <section className="py-4" style={{ backgroundColor: "var(--muted)" }}>
        <div className="container mx-auto px-4">
          <nav className="flex items-center space-x-2 ">
            <Link
              href="/"
              className="transition-colors hover:opacity-80"
              style={{ color: "var(--muted-foreground)" }}
            >
              Home
            </Link>
            <i
              className="fa-solid fa-chevron-right text-xs"
              style={{ color: "var(--muted-foreground)" }}
            ></i>
            <Link
              href="/catalog"
              className="transition-colors hover:opacity-80"
              style={{ color: "var(--muted-foreground)" }}
            >
              Courses
            </Link>
            <i
              className="fa-solid fa-chevron-right text-xs"
              style={{ color: "var(--muted-foreground)" }}
            ></i>
            <span className="font-medium" style={{ color: "var(--secondary)" }}>
              {course.title}
            </span>
          </nav>
        </div>
      </section>

      {/* Course Hero Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <span
                    className="px-3 py-1 rounded-full  font-medium"
                    style={{
                      backgroundColor: "var(--accent)",
                      color: "var(--accent-foreground)",
                    }}
                  >
                    AI Course
                  </span>
                  <span
                    className="px-3 py-1 rounded-full  font-medium capitalize"
                    style={{
                      backgroundColor: "var(--primary)",
                      color: "var(--primary-foreground)",
                    }}
                  >
                    {course.level} Friendly
                  </span>
                </div>

                <h1
                  className="text-4xl lg:text-5xl font-bold mb-4 leading-tight"
                  style={{ color: "var(--secondary)" }}
                >
                  {course.title}
                </h1>

                <p
                  className="text-xl leading-relaxed mb-6"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {course.description}
                </p>

                <div className="hidden items-center space-x-6 mb-6">
                  <div className="flex items-center">
                    <div
                      className="flex mr-2"
                      style={{ color: "var(--accent)" }}
                    >
                      {[...Array(5)].map((_, i) => (
                        <i key={i} className="fa-solid fa-star"></i>
                      ))}
                    </div>
                    <span
                      className="font-semibold mr-2"
                      style={{ color: "var(--secondary)" }}
                    >
                      {course.rating || 4.8}
                    </span>
                    <span style={{ color: "var(--muted-foreground)" }}>
                      ({course.reviewCount || 247} reviews)
                    </span>
                  </div>
                  <div
                    className="hidden items-center"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    <i className="fa-solid fa-users mr-2"></i>
                    <span>{course.studentCount || 589} students enrolled</span>
                  </div>
                </div>

                <div
                  className="flex items-center space-x-8  mb-8"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <div className="flex items-center">
                    <i className="fa-regular fa-clock mr-2"></i>
                    <span>{formatDuration(course.durationMinutes)} total</span>
                  </div>
                  <div className="flex items-center">
                    <i className="fa-solid fa-play mr-2"></i>
                    <span>{course.modules?.length || 0} lessons</span>
                  </div>
                  <div className="flex items-center">
                    <i className="fa-solid fa-robot mr-2"></i>
                    <span>AI projects</span>
                  </div>

                </div>
              </div>
            </div>

            {/* Enrollment Sidebar */}
            <div className="lg:col-span-1">
              <div
                style={{
                  position: "sticky",
                  top: "120px",
                  height: "fit-content",
                }}
              >
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    backgroundColor: "var(--card)",
                    boxShadow:
                      "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
                  }}
                >
                  <div className="relative">
                    <div
                      className="w-full object-cover flex items-center justify-center"
                      style={{
                        aspectRatio: "16/9",
                        backgroundColor: "var(--muted)",
                        backgroundImage: course.heroImageUrl
                          ? `url(${course.heroImageUrl})`
                          : undefined,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
                      >
                        <button
                          className="w-16 h-16 rounded-full flex items-center justify-center transition-colors"
                          style={{ backgroundColor: "var(--primary)" }}
                        >
                          <i
                            className="fa-solid fa-play text-xl ml-1"
                            style={{ color: "var(--primary-foreground)" }}
                          ></i>
                        </button>
                      </div>
                      <div
                        className="absolute top-4 right-4 px-3 py-1 rounded "
                        style={{
                          backgroundColor: "rgba(0, 0, 0, 0.7)",
                          color: "white",
                        }}
                      >
                        Preview Course
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="text-3xl font-bold"
                          style={{ color: "var(--secondary)" }}
                        >
                          Free
                        </span>
                      </div>
                      <p
                        className=""
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        This course is available for free to all users
                      </p>
                    </div>

                    <div className="space-y-3 mb-6">
                      {course.enrollment?.status === "enrolled" ? (
                        <Link
                          href={`/courses/${courseId}/learn`}
                          className="w-full py-3 px-6 rounded-lg font-semibold text-lg text-center block transition-colors hover:opacity-90"
                          style={{
                            backgroundColor: "var(--primary)",
                            color: "var(--primary-foreground)",
                          }}
                        >
                          Continue Learning
                        </Link>
                      ) : firebaseUser ? (
                        <button
                          onClick={async () => {
                            try {
                              const token = await firebaseUser.getIdToken();
                              const idempotencyKey = generateIdempotencyKey();

                              const response = await fetch("/api/enroll", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${token}`,
                                  "x-idempotency-key": idempotencyKey,
                                },
                                body: JSON.stringify({ courseId }),
                              });

                              if (response.ok) {
                                // Refresh course data to show enrollment
                                await fetchCourseDetails();
                              } else {
                                const errorData = await response.json();
                                console.error("Enrollment failed:", errorData);
                              }
                            } catch (error) {
                              console.error("Enrollment error:", error);
                            }
                          }}
                          className="w-full py-3 px-6 rounded-lg font-semibold text-lg transition-colors hover:opacity-90"
                          style={{
                            backgroundColor: "var(--primary)",
                            color: "var(--primary-foreground)",
                          }}
                        >
                          Enroll Now
                        </button>
                      ) : (
                        <Link
                          href={`/login?redirect=/courses/${courseId}`}
                          className="w-full py-3 px-6 rounded-lg font-semibold text-lg text-center block transition-colors hover:opacity-90"
                          style={{
                            backgroundColor: "var(--primary)",
                            color: "var(--primary-foreground)",
                          }}
                        >
                          Enroll Now
                        </Link>
                      )}
                      <button
                        className="hidden w-full py-3 px-6 rounded-lg font-semibold text-center transition-colors"
                        style={{
                          boxShadow:
                            "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
                          color: "var(--secondary)",
                          backgroundColor: "var(--card)",
                        }}
                      >
                        Add to Wishlist
                      </button>
                    </div>

                    <div
                      className="text-center  mb-6"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Full lifetime access
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Content/Curriculum */}
      {sections.length > 0 && (
        <section className="py-16" style={{ backgroundColor: "var(--muted)" }}>
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2
                  className="text-3xl font-bold mb-4"
                  style={{ color: "var(--secondary)" }}
                >
                  Course Content
                </h2>
                <p
                  className="text-xl"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {course.modules?.length || 0} lessons •{" "}
                  {formatDuration(course.durationMinutes)} total length
                </p>
              </div>

              <div className="space-y-4">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className="rounded-xl overflow-hidden"
                    style={{
                      backgroundColor: "var(--card)",
                      boxShadow:
                        "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
                    }}
                  >
                    <div
                      className="p-6 border-b"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => toggleSection(section.id)}
                            className="transition-colors"
                            style={{ color: "var(--primary)" }}
                          >
                            <i
                              className={`fa-solid ${
                                expandedSections.includes(section.id)
                                  ? "fa-chevron-down"
                                  : "fa-chevron-right"
                              }`}
                            ></i>
                          </button>
                          <h3
                            className="text-lg font-semibold"
                            style={{ color: "var(--secondary)" }}
                          >
                            {section.title}
                          </h3>
                        </div>
                        <div
                          className=""
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          {section.modules.length} lessons •{" "}
                          {formatDuration(section.totalDuration)}
                        </div>
                      </div>
                    </div>
                    {expandedSections.includes(section.id) && (
                      <div
                        className="divide-y"
                        style={{ borderColor: "var(--border)" }}
                      >
                        {section.modules.map((module, index) => (
                          <div
                            key={module.id}
                            className="p-4 transition-colors cursor-pointer hover:opacity-80"
                            style={{ backgroundColor: "var(--card)" }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <i
                                  className={`fa-solid ${
                                    index === 0 ? "fa-play-circle" : "fa-lock"
                                  }`}
                                  style={{
                                    color:
                                      index === 0
                                        ? "var(--primary)"
                                        : "var(--muted-foreground)",
                                  }}
                                ></i>
                                <div>
                                  <h4
                                    className="font-medium"
                                    style={{ color: "var(--secondary)" }}
                                  >
                                    {index + 1}. {module.title}
                                  </h4>
                                  {module.summary && (
                                    <p
                                      className=""
                                      style={{
                                        color: "var(--muted-foreground)",
                                      }}
                                    >
                                      {module.summary}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <span
                                  className=""
                                  style={{ color: "var(--muted-foreground)" }}
                                >
                                  {formatDuration(module.estMinutes)}
                                </span>
                                {index === 0 && (
                                  <span
                                    className="px-2 py-1 rounded text-xs"
                                    style={{
                                      backgroundColor: "var(--primary)",
                                      color: "var(--primary-foreground)",
                                      // opacity: 0.1,
                                    }}
                                  >
                                    Preview
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-center mt-8">
                <button
                  className="font-semibold"
                  style={{ color: "var(--primary)" }}
                  onClick={() => {
                    const allSectionIds = sections.map((s) => s.id);
                    setExpandedSections((prev) =>
                      prev.length === allSectionIds.length ? [] : allSectionIds
                    );
                  }}
                >
                  {expandedSections.length === sections.length
                    ? "Collapse all sections"
                    : "Expand all sections"}
                  <i className="fa-solid fa-chevron-down ml-2"></i>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Requirements & Who This Course Is For */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <div
                className="p-8 rounded-2xl"
                style={{
                  backgroundColor: "var(--card)",
                  boxShadow:
                    "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
                  boxShadow: "var(--shadow-lg)",
                }}
              >
                <h3 className="text-xl font-semibold mb-6 flex items-center">
                  <i
                    className="fa-solid fa-list-check mr-3"
                    style={{ color: "var(--primary)" }}
                  ></i>
                  Requirements
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <i
                      className="fa-solid fa-check mr-3 mt-1"
                      style={{ color: "var(--primary)" }}
                    ></i>
                    <span style={{ color: "var(--muted-foreground)" }}>
                      A computer with internet connection
                    </span>
                  </li>
                  <li className="flex items-start">
                    <i
                      className="fa-solid fa-check mr-3 mt-1"
                      style={{ color: "var(--primary)" }}
                    ></i>
                    <span style={{ color: "var(--muted-foreground)" }}>
                      No prior AI experience required
                    </span>
                  </li>
                  <li className="flex items-start">
                    <i
                      className="fa-solid fa-check mr-3 mt-1"
                      style={{ color: "var(--primary)" }}
                    ></i>
                    <span style={{ color: "var(--muted-foreground)" }}>
                      Basic understanding of programming (helpful but not
                      required)
                    </span>
                  </li>
                  <li className="flex items-start">
                    <i
                      className="fa-solid fa-check mr-3 mt-1"
                      style={{ color: "var(--primary)" }}
                    ></i>
                    <span style={{ color: "var(--muted-foreground)" }}>
                      Willingness to learn and practice
                    </span>
                  </li>
                </ul>
              </div>

              <div
                className="p-8 rounded-2xl"
                style={{
                  backgroundColor: "var(--card)",
                  boxShadow:
                    "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
                  boxShadow: "var(--shadow-lg)",
                }}
              >
                <h3 className="text-xl font-semibold mb-6 flex items-center">
                  <i
                    className="fa-solid fa-target mr-3"
                    style={{ color: "var(--accent)" }}
                  ></i>
                  Who this course is for
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <i
                      className="fa-solid fa-user mr-3 mt-1"
                      style={{ color: "var(--accent)" }}
                    ></i>
                    <span style={{ color: "var(--muted-foreground)" }}>
                      Complete beginners to artificial intelligence
                    </span>
                  </li>
                  <li className="flex items-start">
                    <i
                      className="fa-solid fa-user mr-3 mt-1"
                      style={{ color: "var(--accent)" }}
                    ></i>
                    <span style={{ color: "var(--muted-foreground)" }}>
                      Students seeking to understand AI fundamentals
                    </span>
                  </li>
                  <li className="flex items-start">
                    <i
                      className="fa-solid fa-user mr-3 mt-1"
                      style={{ color: "var(--accent)" }}
                    ></i>
                    <span style={{ color: "var(--muted-foreground)" }}>
                      Professionals looking to upskill in AI
                    </span>
                  </li>
                  <li className="flex items-start">
                    <i
                      className="fa-solid fa-user mr-3 mt-1"
                      style={{ color: "var(--accent)" }}
                    ></i>
                    <span style={{ color: "var(--muted-foreground)" }}>
                      Anyone curious about machine learning and AI
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section
        className="py-20"
        style={{
          background:
            "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
        }}
      >
        <div className="container mx-auto px-4 text-center">
          <h2
            className="text-4xl lg:text-5xl font-bold mb-6"
            style={{ color: "var(--primary-foreground)" }}
          >
            Ready to start your AI learning journey?
          </h2>
          <p
            className="text-xl mb-8 max-w-2xl mx-auto"
            style={{ color: "var(--primary-foreground)", opacity: 0.8 }}
          >
            Join thousands of students who are already mastering AI. Enroll now
            and start learning today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
              style={{
                backgroundColor: "var(--card)",
                color: "var(--secondary)",
              }}
            >
              Enroll Now - Free
            </Link>
            <button
              className="px-8 py-4 rounded-lg font-semibold text-lg border-2 transition-colors"
              style={{
                borderColor: "var(--primary-foreground)",
                color: "var(--primary-foreground)",
              }}
            >
              Try Free Preview
            </button>
          </div>
          <div
            className="mt-8"
            style={{ color: "var(--primary-foreground)", opacity: 0.6 }}
          >
            <p>✓ Full lifetime access ✓ Mobile and desktop access</p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
