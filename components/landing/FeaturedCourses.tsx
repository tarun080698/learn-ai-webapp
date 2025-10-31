"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/(auth)/AuthProvider";
import {
  CourseCard,
  CourseCardData,
  CourseCardAction,
} from "@/components/ui/CourseCard";

interface FeaturedCourse {
  id: string;
  title: string;
  description: string;
  heroImageUrl?: string;
  level: "beginner" | "intermediate" | "advanced";
  durationMinutes: number;
  moduleCount: number;
  published: boolean;
  createdAt: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
}

export function FeaturedCourses() {
  const [courses, setCourses] = useState<FeaturedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const { firebaseUser } = useAuth();

  // Fetch latest 3 published courses
  useEffect(() => {
    const fetchLatestCourses = async () => {
      try {
        const response = await fetch("/api/catalog");
        if (response.ok) {
          const data = await response.json();
          // Get the 3 most recent published courses
          const latestCourses =
            data.courses
              ?.filter((course: any) => course.published)
              ?.sort(
                (a: any, b: any) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              ?.slice(0, 3) || [];
          setCourses(latestCourses);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestCourses();
  }, []);

  // Convert course data to CourseCardData format
  const convertToCourseCardData = (course: FeaturedCourse): CourseCardData => {
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      level: course.level,
      durationMinutes: course.durationMinutes,
      moduleCount: course.moduleCount,
      heroImageUrl: course.heroImageUrl,
      category: course.category || "Course",
      rating: course.rating || 4.8,
      reviewCount: course.reviewCount || Math.floor(Math.random() * 1000) + 100,
    };
  };

  // Generate course actions based on authentication status
  const generateCourseActions = (
    course: FeaturedCourse
  ): CourseCardAction[] => {
    return [
      {
        label: "View Course",
        href: `/courses/${course.id}`,
        variant: "secondary",
      },
      {
        label: firebaseUser ? "Enroll Now" : "Enroll Now",
        href: firebaseUser
          ? `/courses/${course.id}`
          : `/login?redirect=/courses/${course.id}`,
        variant: "primary",
      },
    ];
  };

  if (loading) {
    return (
      <section id="trending-courses" className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2
                className="text-3xl lg:text-4xl font-bold mb-4"
                style={{ color: "var(--secondary)" }}
              >
                Latest Courses
              </h2>
              <p
                className="text-xl"
                style={{ color: "var(--muted-foreground)" }}
              >
                Discover our newest AI courses
              </p>
            </div>
            <Link
              href="/catalog"
              className="hidden md:flex items-center font-semibold transition-colors hover:opacity-80"
              style={{ color: "var(--primary)" }}
            >
              View all courses
              <i className="fa-solid fa-arrow-right ml-2"></i>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-300 h-48 rounded-t-2xl"></div>
                <div className="bg-white p-6 rounded-b-2xl border">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="trending-courses" className="py-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ color: "var(--secondary)" }}
            >
              Latest Courses
            </h2>
            <p className="text-xl" style={{ color: "var(--muted-foreground)" }}>
              Discover our newest AI courses
            </p>
          </div>
          <Link
            href="/catalog"
            className="hidden md:flex items-center font-semibold transition-colors hover:opacity-80"
            style={{ color: "var(--primary)" }}
          >
            View all courses
            <i className="fa-solid fa-arrow-right ml-2"></i>
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.length > 0 ? (
            courses.map((course) => (
              <CourseCard
                key={course.id}
                course={convertToCourseCardData(course)}
                actions={generateCourseActions(course)}
                showImage={true}
                showStats={true}
                size="md"
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div
                className="text-4xl mb-4"
                style={{ color: "var(--muted-foreground)" }}
              >
                📚
              </div>
              <h3
                className="text-xl font-semibold mb-2"
                style={{ color: "var(--secondary)" }}
              >
                No courses available yet
              </h3>
              <p style={{ color: "var(--muted-foreground)" }}>
                Check back soon for exciting new courses!
              </p>
            </div>
          )}
        </div>
        <div className="text-center mt-12">
          <Link
            href="/catalog"
            className="inline-flex items-center px-8 py-3 rounded-lg font-semibold transition-all duration-200"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
              boxShadow: "var(--shadow)",
            }}
          >
            View all courses
            <i className="fa-solid fa-arrow-right ml-2"></i>
          </Link>
        </div>
      </div>
    </section>
  );
}
