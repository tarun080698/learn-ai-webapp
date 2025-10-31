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
      <div className="bg-background">
        {/* Hero Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl lg:text-5xl font-bold text-secondary mb-6">
                Course Catalog
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Explore our comprehensive collection of AI and machine learning
                courses designed to advance your skills.
              </p>
              <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <i className="fa-solid fa-graduation-cap text-primary mr-2"></i>
                  <span>{courses.length} Courses</span>
                </div>
                <div className="flex items-center">
                  <i className="fa-solid fa-users text-primary mr-2"></i>
                  <span>Expert Instructors</span>
                </div>
                <div className="flex items-center">
                  <i className="fa-solid fa-certificate text-primary mr-2"></i>
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
                <h3 className="text-2xl font-semibold mb-4 text-secondary">
                  No Courses Available Yet
                </h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Our team is working hard to bring you amazing courses. Check
                  back soon for exciting new content!
                </p>
                <Link
                  href="/admin/login"
                  className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  <i className="fa-solid fa-lock mr-2"></i>
                  Admin Login
                </Link>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-semibold text-secondary">
                    Available Courses
                  </h2>
                  <span className="text-muted-foreground">
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
