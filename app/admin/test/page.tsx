"use client";

import { useAuth } from "@/app/(auth)/AuthProvider";
import { useAuthenticatedMutation } from "@/hooks/useAuthenticatedFetch";
import { useState } from "react";

export default function AdminTestingPage() {
  const { firebaseUser } = useAuth();

  // Authenticated API hooks
  const seedDataApi = useAuthenticatedMutation();
  const createCourseApi = useAuthenticatedMutation();
  const createModuleApi = useAuthenticatedMutation();
  const publishCourseApi = useAuthenticatedMutation();

  // State for admin testing
  const [seedResult, setSeedResult] = useState<string>("");
  const [courseResult, setCourseResult] = useState<string>("");
  const [moduleResult, setModuleResult] = useState<string>("");
  const [publishResult, setPublishResult] = useState<string>("");

  // Form state
  const [courseTitle, setCourseTitle] = useState<string>(
    "Test Course " + new Date().getTime()
  );
  const [courseDescription, setCourseDescription] = useState<string>(
    "A test course created from the admin interface"
  );
  const [courseDuration, setCourseDuration] = useState<number>(120);
  const [courseLevel, setCourseLevel] = useState<
    "beginner" | "intermediate" | "advanced"
  >("beginner");

  const [targetCourseId, setTargetCourseId] = useState<string>("");
  const [moduleTitle, setModuleTitle] = useState<string>("Test Module");
  const [moduleIndex, setModuleIndex] = useState<number>(0);
  const [moduleContentType, setModuleContentType] = useState<
    "video" | "text" | "pdf" | "link"
  >("text");
  const [moduleContent, setModuleContent] = useState<string>(
    "# Test Module\n\nThis is test content for the module."
  );

  // Test functions
  const testSeedData = async () => {
    if (!firebaseUser) {
      setSeedResult("Please log in as admin first");
      return;
    }

    try {
      const data = (await seedDataApi.mutate("/api/admin/seed.dev", {})) as any;
      setSeedResult(JSON.stringify(data, null, 2));

      // Auto-fill course ID if successful
      if (data.ok && data.created) {
        setTargetCourseId(data.created.courseId);
      }
    } catch (error) {
      setSeedResult(`Error: ${error}`);
    }
  };

  const testCreateCourse = async () => {
    if (!firebaseUser) {
      setCourseResult("Please log in as admin first");
      return;
    }

    try {
      const data = (await createCourseApi.mutate("/api/admin/course.upsert", {
        title: courseTitle,
        description: courseDescription,
        durationMinutes: courseDuration,
        level: courseLevel,
        heroImageUrl:
          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",
      })) as any;
      setCourseResult(JSON.stringify(data, null, 2));

      // Auto-fill course ID if successful
      if (data.ok && data.courseId) {
        setTargetCourseId(data.courseId);
      }
    } catch (error) {
      setCourseResult(`Error: ${error}`);
    }
  };

  const testCreateModule = async () => {
    if (!firebaseUser || !targetCourseId) {
      setModuleResult("Please log in as admin and enter a course ID first");
      return;
    }

    try {
      const moduleData: {
        courseId: string;
        index: number;
        title: string;
        summary: string;
        contentType: string;
        estMinutes: number;
        body?: string;
        contentUrl?: string;
      } = {
        courseId: targetCourseId,
        index: moduleIndex,
        title: moduleTitle,
        summary: `Summary for ${moduleTitle}`,
        contentType: moduleContentType,
        estMinutes: 15,
      };

      // Add content based on type
      if (moduleContentType === "text") {
        moduleData.body = moduleContent;
      } else {
        moduleData.contentUrl = "https://example.com/content.pdf";
      }

      const data = (await createModuleApi.mutate(
        "/api/admin/module.upsert",
        moduleData
      )) as any;
      setModuleResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setModuleResult(`Error: ${error}`);
    }
  };

  const testPublishCourse = async () => {
    if (!firebaseUser || !targetCourseId) {
      setPublishResult("Please log in as admin and enter a course ID first");
      return;
    }

    try {
      const data = (await publishCourseApi.mutate("/api/admin/course.publish", {
        courseId: targetCourseId,
        published: true,
      })) as any;
      setPublishResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setPublishResult(`Error: ${error}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Testing Interface</h1>
        <p className="text-muted-foreground">
          Test all Phase 2 admin endpoints
        </p>
      </div>

      {!firebaseUser && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-red-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-red-800">
            Please log in as an admin to test these endpoints.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Seed Data Testing */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">1. Create Seed Data</h2>
          <p className=" text-muted-foreground">
            Creates a sample course with 3 modules for testing
          </p>
          <button
            onClick={testSeedData}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Seed Data
          </button>
          {seedResult && (
            <div className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-48">
              <pre>{seedResult}</pre>
            </div>
          )}
        </div>

        {/* Course Creation */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">2. Create Custom Course</h2>
          <input
            type="text"
            placeholder="Course Title"
            value={courseTitle}
            onChange={(e) => setCourseTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <textarea
            placeholder="Course Description"
            value={courseDescription}
            onChange={(e) => setCourseDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Duration (minutes)"
              value={courseDuration}
              onChange={(e) => setCourseDuration(parseInt(e.target.value) || 0)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <select
              value={courseLevel}
              onChange={(e) =>
                setCourseLevel(
                  e.target.value as "beginner" | "intermediate" | "advanced"
                )
              }
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <button
            onClick={testCreateCourse}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Create Course
          </button>
          {courseResult && (
            <div className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-48">
              <pre>{courseResult}</pre>
            </div>
          )}
        </div>

        {/* Module Creation */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">3. Add Module</h2>
          <input
            type="text"
            placeholder="Course ID (auto-filled from creation)"
            value={targetCourseId}
            onChange={(e) => setTargetCourseId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Module Title"
              value={moduleTitle}
              onChange={(e) => setModuleTitle(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="number"
              placeholder="Module Index (0, 1, 2...)"
              value={moduleIndex}
              onChange={(e) => setModuleIndex(parseInt(e.target.value) || 0)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <select
            value={moduleContentType}
            onChange={(e) =>
              setModuleContentType(
                e.target.value as "video" | "text" | "pdf" | "link"
              )
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="text">Text Content</option>
            <option value="video">Video</option>
            <option value="pdf">PDF Document</option>
            <option value="link">External Link</option>
          </select>
          {moduleContentType === "text" && (
            <textarea
              placeholder="Module content (Markdown)"
              value={moduleContent}
              onChange={(e) => setModuleContent(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          )}
          <button
            onClick={testCreateModule}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Add Module
          </button>
          {moduleResult && (
            <div className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-48">
              <pre>{moduleResult}</pre>
            </div>
          )}
        </div>

        {/* Course Publishing */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">4. Publish Course</h2>
          <p className=" text-muted-foreground">
            Makes the course visible to users for enrollment
          </p>
          <input
            type="text"
            placeholder="Course ID to publish"
            value={targetCourseId}
            onChange={(e) => setTargetCourseId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <button
            onClick={testPublishCourse}
            className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Publish Course
          </button>
          {publishResult && (
            <div className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-48">
              <pre>{publishResult}</pre>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">
          Testing Instructions
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-blue-800">
          <li>
            <strong>Start with Seed Data:</strong> Click &quot;Create Seed
            Data&quot; to generate a sample course
          </li>
          <li>
            <strong>Or Create Custom:</strong> Fill in the course form and click
            &quot;Create Course&quot;
          </li>
          <li>
            <strong>Add Modules:</strong> Use the auto-filled Course ID to add
            modules
          </li>
          <li>
            <strong>Publish:</strong> Make the course visible to users by
            publishing it
          </li>
          <li>
            <strong>Test User Flow:</strong> Go to <code>/dashboard</code> to
            test user enrollment and progress
          </li>
        </ol>

        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="font-semibold text-yellow-800 mb-2">
            Expected Results:
          </h3>
          <ul className=" text-yellow-700 space-y-1">
            <li>• Seed data creates 1 course + 3 modules</li>
            <li>• Course creation returns a course ID</li>
            <li>• Module creation updates course.moduleCount</li>
            <li>• Publishing enables user enrollment</li>
            <li>
              • All responses follow{" "}
              <code>
                {"{"} ok: true {"}"}
              </code>{" "}
              format
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
