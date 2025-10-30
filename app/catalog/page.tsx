import Link from "next/link";
import { Navigation } from "@/app/components/Navigation";

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
  createdAt: string;
}

// Phase 2: Catalog page - Server Component
async function fetchPublishedCourses(): Promise<Course[]> {
  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/api/catalog`,
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
    <div className="min-h-screen">
      <Navigation />

      {/* Content */}
      <main className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Course Catalog</h1>

        {/* Course Listing */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Available Courses</h2>
            <span className=" text-muted-foreground">
              {courses.length} course{courses.length !== 1 ? "s" : ""} available
            </span>
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📚</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">No Courses Yet</h3>
              <p className="text-muted-foreground mb-4">
                Courses will appear here once they are published by
                administrators.
              </p>
              <Link
                href="/admin/login"
                className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Admin Login
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">
                        {course.title}
                      </h3>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {course.level}
                      </span>
                    </div>
                  </div>

                  <p className=" text-muted-foreground mb-4 line-clamp-3">
                    {course.description}
                  </p>

                  <div className="flex justify-between items-center text-xs text-muted-foreground mb-4">
                    <div className="flex items-center space-x-4">
                      <span>📚 {course.moduleCount} modules</span>
                      <span>⏱️ {course.durationMinutes} min</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/courses/${course.id}`}
                      className="flex-1 px-4 py-2 bg-primary text-primary-foreground text-center rounded-lg hover:bg-primary/90 transition-colors "
                    >
                      Enroll Now
                    </Link>
                    <Link
                      href={`/courses/${course.id}`}
                      className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors "
                    >
                      Preview
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
