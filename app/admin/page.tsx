"use client";

import { useAuth } from "@/app/(auth)/AuthProvider";
import Link from "next/link";
import { useState, useEffect } from "react";

interface Course {
  id: string;
  title: string;
  description: string;
  isPublished: boolean;
  moduleCount: number;
  estimatedDuration: number;
  level: string;
  createdAt: string;
}

interface Questionnaire {
  id: string;
  title: string;
  purpose: "survey" | "quiz" | "mixed";
  version: number;
  questions: Array<{
    id: string;
    type: "single" | "multi" | "scale" | "text";
    prompt: string;
    required: boolean;
  }>;
  createdAt: string;
}

interface Assignment {
  id: string;
  questionnaireId: string;
  questionnaireVersion: number;
  scope: { type: "course" | "module"; courseId: string; moduleId?: string };
  timing: "pre" | "post";
  active: boolean;
  createdAt: string;
}

export default function AdminPage() {
  const { firebaseUser, role, loading, signOutAll } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [seedResult, setSeedResult] = useState<string>("");

  // Phase 3: Questionnaire state
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingQuestionnaires, setLoadingQuestionnaires] = useState(false);
  const [questionnaireResult, setQuestionnaireResult] = useState<string>("");

  // Load courses when user is authenticated
  useEffect(() => {
    if (firebaseUser && role === "admin") {
      loadCourses();
      loadQuestionnaires();
    }
  }, [firebaseUser, role]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCourses = async () => {
    setLoadingCourses(true);
    try {
      // Use the new catalog API endpoint to show all courses (not just published)
      const response = await fetch("/api/catalog");
      if (response.ok) {
        const data = await response.json();
        setCourses(
          data.courses.map(
            (course: {
              id: string;
              title: string;
              description: string;
              published: boolean;
              moduleCount: number;
              durationMinutes: number;
              level: string;
              createdAt: string;
            }) => ({
              id: course.id,
              title: course.title,
              description: course.description,
              isPublished: course.published,
              moduleCount: course.moduleCount,
              estimatedDuration: course.durationMinutes,
              level: course.level,
              createdAt: course.createdAt,
            })
          ) || []
        );
      } else {
        console.error("Failed to load courses:", response.statusText);
      }
    } catch (error) {
      console.error("Error loading courses:", error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const createSeedData = async () => {
    if (!firebaseUser) return;

    try {
      setSeedResult("Creating seed data...");
      const token = await firebaseUser.getIdToken();
      const response = await fetch("/api/admin/seed.dev", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        setSeedResult(
          `✅ Seed data created successfully! Course ID: ${result.courseId}`
        );
        loadCourses(); // Refresh courses
      } else {
        const error = await response.text();
        setSeedResult(`❌ Error: ${error}`);
      }
    } catch (error) {
      setSeedResult(`❌ Error: ${error}`);
    }
  };

  const publishCourse = async (courseId: string) => {
    if (!firebaseUser) return;

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch("/api/admin/course.publish", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ courseId }),
      });

      if (response.ok) {
        setSeedResult(`✅ Course published successfully!`);
        loadCourses(); // Refresh courses
      } else {
        const error = await response.text();
        setSeedResult(`❌ Publish error: ${error}`);
      }
    } catch (error) {
      setSeedResult(`❌ Publish error: ${error}`);
    }
  };

  const loadQuestionnaires = async () => {
    setLoadingQuestionnaires(true);
    try {
      if (!firebaseUser) return;
      
      const token = await firebaseUser.getIdToken();
      
      // Load questionnaires
      const questionnairesResponse = await fetch("/api/admin/questionnaires", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (questionnairesResponse.ok) {
        const questionnairesData = await questionnairesResponse.json();
        setQuestionnaires(questionnairesData.questionnaires || []);
      }
      
      // Load assignments
      const assignmentsResponse = await fetch("/api/admin/assignments", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        setAssignments(assignmentsData.assignments || []);
      }
      
    } catch (error) {
      console.error("Failed to load questionnaires:", error);
    } finally {
      setLoadingQuestionnaires(false);
    }
  };

  const createSampleQuestionnaire = async () => {
    if (!firebaseUser) return;

    try {
      const token = await firebaseUser.getIdToken();

      const sampleQuestionnaire = {
        title: "Course Satisfaction Survey",
        purpose: "survey" as const,
        questions: [
          {
            id: "q1",
            type: "scale" as const,
            prompt: "How would you rate this course overall?",
            scale: { min: 1, max: 5, labels: { 1: "Poor", 5: "Excellent" } },
            required: true,
          },
          {
            id: "q2",
            type: "single" as const,
            prompt: "Would you recommend this course to others?",
            options: [
              { id: "yes", label: "Yes, definitely" },
              { id: "maybe", label: "Maybe" },
              { id: "no", label: "No" },
            ],
            required: true,
          },
          {
            id: "q3",
            type: "text" as const,
            prompt: "What could be improved about this course?",
            required: false,
          },
        ],
      };

      const response = await fetch("/api/admin/questionnaire.upsert", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sampleQuestionnaire),
      });

      if (response.ok) {
        const result = await response.json();
        setQuestionnaireResult(
          `✅ Questionnaire created: ${result.questionnaireId}`
        );
        loadQuestionnaires();
      } else {
        const error = await response.text();
        setQuestionnaireResult(`❌ Error: ${error}`);
      }
    } catch (error) {
      setQuestionnaireResult(`❌ Error: ${error}`);
    }
  };

  const createSampleAssignment = async (courseId: string) => {
    if (!firebaseUser) return;

    try {
      const token = await firebaseUser.getIdToken();

      const sampleAssignment = {
        questionnaireId: "sample-questionnaire-id", // In practice, use actual questionnaire ID
        scope: { type: "course" as const, courseId },
        timing: "post" as const,
        active: true,
      };

      const response = await fetch("/api/admin/assignment.upsert", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sampleAssignment),
      });

      if (response.ok) {
        const result = await response.json();
        setQuestionnaireResult(`✅ Assignment created: ${result.assignmentId}`);
        loadQuestionnaires();
      } else {
        const error = await response.text();
        setQuestionnaireResult(`❌ Error: ${error}`);
      }
    } catch (error) {
      setQuestionnaireResult(`❌ Error: ${error}`);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Admin Access Required</h1>
          <p className="text-muted-foreground">
            Please sign in with your admin account.
          </p>
          <Link
            href="/admin/login"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Admin Login
          </Link>
        </div>
      </div>
    );
  }

  if (role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">
            Access Forbidden
          </h1>
          <p className="text-muted-foreground">
            You do not have admin privileges.
          </p>
          <button
            onClick={signOutAll}
            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Welcome, {firebaseUser.email}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/test"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Advanced Testing
          </Link>
          <button
            onClick={signOutAll}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <button
          onClick={createSeedData}
          className="p-4 border rounded-lg hover:bg-muted transition-colors text-left"
        >
          <h3 className="font-semibold mb-2">🌱 Create Seed Data</h3>
          <p className="text-sm text-muted-foreground">
            Generate sample courses and modules for testing
          </p>
        </button>

        <button
          onClick={createSampleQuestionnaire}
          className="p-4 border rounded-lg hover:bg-muted transition-colors text-left"
        >
          <h3 className="font-semibold mb-2">📝 Sample Survey</h3>
          <p className="text-sm text-muted-foreground">
            Create a sample questionnaire template
          </p>
        </button>

        <Link
          href="/catalog"
          className="p-4 border rounded-lg hover:bg-muted transition-colors text-left block"
        >
          <h3 className="font-semibold mb-2">📚 View Catalog</h3>
          <p className="text-sm text-muted-foreground">
            See how courses appear to users
          </p>
        </Link>

        <Link
          href="/admin/test"
          className="p-4 border rounded-lg hover:bg-muted transition-colors text-left block"
        >
          <h3 className="font-semibold mb-2">🧪 Advanced Tools</h3>
          <p className="text-sm text-muted-foreground">
            Full testing interface with API tools
          </p>
        </Link>
      </div>

      {/* Result Messages */}
      {(seedResult || questionnaireResult) && (
        <div className="mb-6 space-y-4">
          {seedResult && (
            <div className="p-4 border rounded-lg bg-muted">
              <h4 className="font-semibold mb-2">Seed Data Result:</h4>
              <pre className="text-sm whitespace-pre-wrap">{seedResult}</pre>
            </div>
          )}
          {questionnaireResult && (
            <div className="p-4 border rounded-lg bg-blue-50">
              <h4 className="font-semibold mb-2">Questionnaire Result:</h4>
              <pre className="text-sm whitespace-pre-wrap">
                {questionnaireResult}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Courses Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Courses</h2>
          <button
            onClick={loadCourses}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Refresh
          </button>
        </div>

        {loadingCourses ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-muted-foreground mb-4">No courses found</p>
            <button
              onClick={createSeedData}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Create Sample Course
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course.id} className="border rounded-lg p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold">{course.title}</h3>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      course.isPublished
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {course.isPublished ? "Published" : "Draft"}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {course.description}
                </p>

                <div className="text-xs text-muted-foreground mb-4 space-y-1">
                  <div>📚 {course.moduleCount} modules</div>
                  <div>⏱️ {course.estimatedDuration} minutes</div>
                  <div>📊 {course.level}</div>
                </div>

                <div className="flex gap-2">
                  {!course.isPublished && (
                    <button
                      onClick={() => publishCourse(course.id)}
                      className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                    >
                      Publish
                    </button>
                  )}
                  <button
                    onClick={() => createSampleAssignment(course.id)}
                    className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                  >
                    Add Survey
                  </button>
                  <Link
                    href={`/admin/test`}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Phase 2 & 3 Status */}
      <div className="mt-12 space-y-6">
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Phase 2 Status - All APIs Ready!
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div className="space-y-1">
              <div>✅ POST /api/admin/course.upsert</div>
              <div>✅ POST /api/admin/module.upsert</div>
              <div>✅ POST /api/admin/course.publish</div>
              <div>✅ POST /api/admin/seed.dev</div>
            </div>
            <div className="space-y-1">
              <div>✅ POST /api/enroll</div>
              <div>✅ POST /api/progress</div>
              <div>✅ Authentication & Authorization</div>
              <div>✅ Firestore Integration</div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-purple-50 border border-purple-200 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-900 mb-2">
            Phase 3 Status - Questionnaire System Ready!
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-700">
            <div className="space-y-1">
              <div>✅ POST /api/admin/questionnaire.upsert</div>
              <div>✅ POST /api/admin/assignment.upsert</div>
              <div>✅ POST /api/questionnaires/context</div>
              <div>✅ POST /api/questionnaires/start</div>
            </div>
            <div className="space-y-1">
              <div>✅ POST /api/questionnaires/submit</div>
              <div>✅ POST /api/modules/access</div>
              <div>✅ Gating System & Scoring</div>
              <div>✅ Version Control & Freezing</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
