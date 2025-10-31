import Link from "next/link";
import { PublicLayout } from "@/components/PublicLayout";
import { CourseCard, CourseCardData } from "@/components/ui/CourseCard";

// Force dynamic rendering for fresh course data
export const dynamic = "force-dynamic";

interface Course {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  level: "beginner" | "intermediate" | "advanced";
  moduleCount: number;
  published: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string;
  enrolled?: boolean;
  enrollmentId?: string | null;
  progressPct?: number;
  completed?: boolean;
  heroImageUrl?: string;
}

// Phase 2: Catalog page - Server Component
async function fetchPublishedCourses(): Promise<Course[]> {
  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/api/catalog-temp`,
      {
        cache: "no-store", // Always fetch fresh data
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch courses:", response.statusText);
      return [];
    }

    const data = await response.json();
    return data.courses || [];
  } catch (error) {
    console.error("Error fetching courses:", error);
    return [];
  }
}

export default async function CatalogPage() {
  const courses = await fetchPublishedCourses();

  return (
    <PublicLayout showPromoBanner={false}>
      <div style={{ backgroundColor: "var(--background)" }}>
        {/* Hero Section */}
        <section className="py-16" style={{ backgroundColor: "var(--muted)" }}>
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h1
                className="text-4xl lg:text-5xl font-bold mb-6"
                style={{ color: "var(--secondary)" }}
              >
                Course Catalog
              </h1>
              <p
                className="text-xl mb-8"
                style={{ color: "var(--muted-foreground)" }}
              >
                Explore our comprehensive collection of AI and machine learning
                courses designed to advance your skills.
              </p>
              <div
                className="flex items-center justify-center space-x-8 "
                style={{ color: "var(--muted-foreground)" }}
              >
                <div className="flex items-center">
                  <i
                    className="fa-solid fa-graduation-cap mr-2"
                    style={{ color: "var(--primary)" }}
                  ></i>
                  <span>{courses.length} Courses</span>
                </div>
                <div className="flex items-center">
                  <i
                    className="fa-solid fa-users mr-2"
                    style={{ color: "var(--primary)" }}
                  ></i>
                  <span>Expert Instructors</span>
                </div>
                <div className="flex items-center">
                  <i
                    className="fa-solid fa-certificate mr-2"
                    style={{ color: "var(--primary)" }}
                  ></i>
                  <span>Certificates Included</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Course Listing */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            {courses.length === 0 ? (
              <div className="text-center py-20">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                  style={{ backgroundColor: "var(--muted)" }}
                >
                  <span className="text-4xl">📚</span>
                </div>
                <h3
                  className="text-2xl font-semibold mb-4"
                  style={{ color: "var(--secondary)" }}
                >
                  No Courses Available Yet
                </h3>
                <p
                  className="mb-8 max-w-md mx-auto"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Our team is working hard to bring you amazing courses. Check
                  back soon for exciting new content!
                </p>
                <Link
                  href="/admin/login"
                  className="inline-flex items-center px-6 py-3 rounded-lg hover:opacity-90 transition-all font-medium"
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "var(--primary-foreground)",
                  }}
                >
                  <i className="fa-solid fa-lock mr-2"></i>
                  Admin Login
                </Link>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h2
                    className="text-2xl font-semibold"
                    style={{ color: "var(--secondary)" }}
                  >
                    Available Courses
                  </h2>
                  <span style={{ color: "var(--muted-foreground)" }}>
                    {courses.length} course{courses.length !== 1 ? "s" : ""}{" "}
                    available
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {courses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course as CourseCardData}
                      showImage={true}
                      showStats={true}
                      showProgress={course.enrolled}
                      layout="vertical"
                      size="md"
                      actions={[
                        {
                          label: course.enrolled
                            ? "Continue Learning"
                            : "Enroll Now",
                          href: `/courses/${course.id}`,
                          variant: "primary",
                        },
                        {
                          label: "Preview",
                          href: `/courses/${course.id}`,
                          variant: "outline",
                        },
                      ]}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
