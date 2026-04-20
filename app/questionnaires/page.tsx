"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/(auth)/AuthProvider";
import { RouteGuard } from "@/app/components/RouteGuard";
import { Navigation } from "@/app/components/Navigation";
import { useAuthenticatedMutation } from "@/hooks/useAuthenticatedFetch";
import { QuestionnaireRunner } from "@/components/QuestionnaireRunner";

interface QuestionnaireAssignment {
  assignmentId: string;
  questionnaireTitle: string;
  scope: { type: "course" | "module"; courseId: string; moduleId?: string };
  timing: "pre" | "post";
  completed: boolean;
}

interface QuestionnaireContextResponse {
  preCourse?: { assignmentId: string; completed: boolean };
  postCourse?: { assignmentId: string; completed: boolean };
  preModule?: { assignmentId: string; completed: boolean };
  postModule?: { assignmentId: string; completed: boolean };
}

export default function QuestionnairePage() {
  const { firebaseUser, loading } = useAuth();
  const [assignments, setAssignments] = useState<QuestionnaireAssignment[]>([]);
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(
    null
  );
  const [message, setMessage] = useState<string>("");
  const [testCourseId, setTestCourseId] = useState("course-intro-ai");
  const [testModuleId, setTestModuleId] = useState("module-1");

  const loadAssignmentsApi = useAuthenticatedMutation();

  const loadAssignments = async () => {
    if (!firebaseUser) return;
    try {
      const data = (await loadAssignmentsApi.mutate(
        "/api/questionnaires/context",
        {
          courseId: testCourseId,
          ...(testModuleId && { moduleId: testModuleId }),
        }
      )) as QuestionnaireContextResponse;

      const list: QuestionnaireAssignment[] = [];
      if (data.preCourse) {
        list.push({
          assignmentId: data.preCourse.assignmentId,
          questionnaireTitle: "Pre-Course",
          scope: { type: "course", courseId: testCourseId },
          timing: "pre",
          completed: data.preCourse.completed,
        });
      }
      if (data.postCourse) {
        list.push({
          assignmentId: data.postCourse.assignmentId,
          questionnaireTitle: "Post-Course",
          scope: { type: "course", courseId: testCourseId },
          timing: "post",
          completed: data.postCourse.completed,
        });
      }
      if (data.preModule) {
        list.push({
          assignmentId: data.preModule.assignmentId,
          questionnaireTitle: "Pre-Module",
          scope: {
            type: "module",
            courseId: testCourseId,
            moduleId: testModuleId,
          },
          timing: "pre",
          completed: data.preModule.completed,
        });
      }
      if (data.postModule) {
        list.push({
          assignmentId: data.postModule.assignmentId,
          questionnaireTitle: "Post-Module",
          scope: {
            type: "module",
            courseId: testCourseId,
            moduleId: testModuleId,
          },
          timing: "post",
          completed: data.postModule.completed,
        });
      }
      setAssignments(list);
    } catch (error) {
      console.error("Error loading assignments:", error);
    }
  };

  useEffect(() => {
    if (firebaseUser) loadAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser, testCourseId, testModuleId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Authentication Required</h1>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <RouteGuard>
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto py-8 max-w-7xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Questionnaires</h1>
              <p className="text-muted-foreground">
                Complete surveys and quizzes for your courses
              </p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>

          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold mb-2">Test Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Course ID:</label>
                <input
                  type="text"
                  value={testCourseId}
                  onChange={(e) => setTestCourseId(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Module ID:</label>
                <input
                  type="text"
                  value={testModuleId}
                  onChange={(e) => setTestModuleId(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <button
              onClick={loadAssignments}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Reload
            </button>
          </div>

          {message && (
            <div className="mb-6 p-4 border rounded-lg bg-muted">
              <pre className="whitespace-pre-wrap">{message}</pre>
            </div>
          )}

          {activeAssignmentId ? (
            <div className="mb-8 p-6 border rounded-lg bg-white shadow-sm">
              <QuestionnaireRunner
                assignmentId={activeAssignmentId}
                onCancel={() => setActiveAssignmentId(null)}
                onComplete={(result) => {
                  setMessage(
                    result.score
                      ? `Submitted. Score: ${result.score.earned}/${result.score.total}`
                      : "Submitted."
                  );
                  setActiveAssignmentId(null);
                  loadAssignments();
                }}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Available Questionnaires</h2>
              {loadAssignmentsApi.loading ? (
                <p>Loading assignments…</p>
              ) : assignments.length === 0 ? (
                <p className="text-muted-foreground">
                  No questionnaires for that course / module combo.
                </p>
              ) : (
                <ul className="grid gap-3">
                  {assignments.map((a) => (
                    <li
                      key={a.assignmentId}
                      className="border rounded-lg p-4 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold">
                          {a.questionnaireTitle}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {a.scope.type} · {a.timing}
                        </div>
                      </div>
                      {a.completed ? (
                        <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm">
                          Completed ✓
                        </span>
                      ) : (
                        <button
                          onClick={() => setActiveAssignmentId(a.assignmentId)}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                        >
                          Start
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </RouteGuard>
  );
}
