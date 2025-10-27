"use client";

import { useAuth } from "@/app/(auth)/AuthProvider";
import { useState, useEffect } from "react";
import Link from "next/link";

interface QuestionnaireAssignment {
  assignmentId: string;
  questionnaireTitle: string;
  scope: { type: "course" | "module"; courseId: string; moduleId?: string };
  timing: "pre" | "post";
  completed: boolean;
}

interface QuestionnaireQuestion {
  id: string;
  type: "single" | "multi" | "scale" | "text";
  prompt: string;
  options?: { id: string; label: string }[];
  scale?: { min: number; max: number; labels?: Record<number, string> };
  required: boolean;
}

interface QuestionnaireTemplate {
  id: string;
  title: string;
  purpose: "survey" | "quiz" | "mixed";
  questions: QuestionnaireQuestion[];
  version: number;
}

interface StartedQuestionnaire {
  assignment: {
    id: string;
    questionnaireId: string;
    questionnaireVersion: number;
    scope: { type: "course" | "module"; courseId: string; moduleId?: string };
    timing: "pre" | "post";
    active: boolean;
  };
  questionnaire: QuestionnaireTemplate;
}

export default function QuestionnairePage() {
  const { firebaseUser, loading } = useAuth();
  const [assignments, setAssignments] = useState<QuestionnaireAssignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [currentQuestionnaire, setCurrentQuestionnaire] = useState<StartedQuestionnaire | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | number | string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string>("");

  // Test course and module IDs for demonstration
  const [testCourseId, setTestCourseId] = useState("course-intro-ai");
  const [testModuleId, setTestModuleId] = useState("module-1");

  useEffect(() => {
    if (firebaseUser) {
      loadAssignments();
    }
  }, [firebaseUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reload when test parameters change
  useEffect(() => {
    if (firebaseUser) {
      loadAssignments();
    }
  }, [testCourseId, testModuleId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAssignments = async () => {
    if (!firebaseUser) return;

    setLoadingAssignments(true);
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch("/api/questionnaires/context", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          courseId: testCourseId,
          ...(testModuleId && { moduleId: testModuleId })
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAssignments([
          ...(data.preCourse ? [{
            assignmentId: data.preCourse.assignmentId,
            questionnaireTitle: "Pre-Course Survey",
            scope: { type: "course" as const, courseId: testCourseId },
            timing: "pre" as const,
            completed: data.preCourse.completed
          }] : []),
          ...(data.postCourse ? [{
            assignmentId: data.postCourse.assignmentId,
            questionnaireTitle: "Post-Course Survey",
            scope: { type: "course" as const, courseId: testCourseId },
            timing: "post" as const,
            completed: data.postCourse.completed
          }] : []),
          ...(data.preModule ? [{
            assignmentId: data.preModule.assignmentId,
            questionnaireTitle: "Pre-Module Survey",
            scope: { type: "module" as const, courseId: testCourseId, moduleId: testModuleId },
            timing: "pre" as const,
            completed: data.preModule.completed
          }] : []),
          ...(data.postModule ? [{
            assignmentId: data.postModule.assignmentId,
            questionnaireTitle: "Post-Module Survey",
            scope: { type: "module" as const, courseId: testCourseId, moduleId: testModuleId },
            timing: "post" as const,
            completed: data.postModule.completed
          }] : [])
        ]);
      } else {
        console.error("Failed to load assignments");
      }
    } catch (error) {
      console.error("Error loading assignments:", error);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const startQuestionnaire = async (assignmentId: string) => {
    if (!firebaseUser) return;

    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch("/api/questionnaires/start", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assignmentId }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentQuestionnaire(data);
        setAnswers({});
        setResult("");
      } else {
        const error = await response.text();
        setResult(`❌ Error starting questionnaire: ${error}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error}`);
    }
  };

  const updateAnswer = (questionId: string, value: string | number | string[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const submitQuestionnaire = async () => {
    if (!firebaseUser || !currentQuestionnaire) return;

    setSubmitting(true);
    try {
      const token = await firebaseUser.getIdToken();
      
      // Convert answers to API format
      const formattedAnswers = Object.entries(answers).map(([questionId, value]) => {
        if (Array.isArray(value)) {
          return { questionId, values: value };
        } else {
          return { questionId, value };
        }
      });

      const response = await fetch("/api/questionnaires/submit", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignmentId: currentQuestionnaire.assignment.id,
          answers: formattedAnswers,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(`✅ Questionnaire submitted successfully! ${data.score ? `Score: ${data.score.earned}/${data.score.total}` : ""}`);
        setCurrentQuestionnaire(null);
        setAnswers({});
        loadAssignments(); // Refresh to show completion status
      } else {
        const error = await response.text();
        setResult(`❌ Error submitting: ${error}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error}`);
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: QuestionnaireQuestion) => {
    switch (question.type) {
      case "single":
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label key={option.id} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={question.id}
                  value={option.id}
                  checked={answers[question.id] === option.id}
                  onChange={(e) => updateAnswer(question.id, e.target.value)}
                  className="text-primary"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        );

      case "multi":
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label key={option.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={Array.isArray(answers[question.id]) && (answers[question.id] as string[]).includes(option.id)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(answers[question.id]) ? answers[question.id] as string[] : [];
                    if (e.target.checked) {
                      updateAnswer(question.id, [...currentValues, option.id]);
                    } else {
                      updateAnswer(question.id, currentValues.filter(v => v !== option.id));
                    }
                  }}
                  className="text-primary"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        );

      case "scale":
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm">{question.scale?.labels?.[question.scale.min] || question.scale?.min}</span>
              <input
                type="range"
                min={question.scale?.min || 1}
                max={question.scale?.max || 5}
                step={1}
                value={answers[question.id] || question.scale?.min || 1}
                onChange={(e) => updateAnswer(question.id, parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm">{question.scale?.labels?.[question.scale.max] || question.scale?.max}</span>
            </div>
            <div className="text-center font-semibold">
              Selected: {answers[question.id] || question.scale?.min || 1}
            </div>
          </div>
        );

      case "text":
        return (
          <textarea
            value={answers[question.id] || ""}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            placeholder="Enter your response..."
            className="w-full p-3 border rounded-lg resize-vertical min-h-[100px]"
            rows={4}
          />
        );

      default:
        return <div>Unsupported question type</div>;
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
          <h1 className="text-2xl font-bold">Authentication Required</h1>
          <p className="text-muted-foreground">Please sign in to access questionnaires.</p>
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
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Questionnaires</h1>
          <p className="text-muted-foreground">Complete surveys and quizzes for your courses</p>
        </div>
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Test Controls */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold mb-2">Test Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Course ID:</label>
            <input
              type="text"
              value={testCourseId}
              onChange={(e) => setTestCourseId(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter course ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Module ID (optional):</label>
            <input
              type="text"
              value={testModuleId}
              onChange={(e) => setTestModuleId(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter module ID"
            />
          </div>
        </div>
        <button
          onClick={loadAssignments}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Load Assignments
        </button>
      </div>

      {result && (
        <div className="mb-6 p-4 border rounded-lg bg-muted">
          <pre className="text-sm whitespace-pre-wrap">{result}</pre>
        </div>
      )}

      {/* Current Questionnaire */}
      {currentQuestionnaire && (
        <div className="mb-8 p-6 border rounded-lg bg-white shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">{currentQuestionnaire.questionnaire.title}</h2>
              <p className="text-muted-foreground">
                {currentQuestionnaire.questionnaire.purpose === "survey" ? "📊 Survey" : 
                 currentQuestionnaire.questionnaire.purpose === "quiz" ? "🧪 Quiz" : "📝 Mixed"}
                {" • "}Version {currentQuestionnaire.questionnaire.version}
              </p>
            </div>
            <button
              onClick={() => setCurrentQuestionnaire(null)}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-8">
            {currentQuestionnaire.questionnaire.questions.map((question, index) => (
              <div key={question.id} className="space-y-4">
                <div className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">
                      {question.prompt}
                      {question.required && <span className="text-red-500 ml-1">*</span>}
                    </h3>
                    {renderQuestion(question)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={submitQuestionnaire}
              disabled={submitting}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit Questionnaire"}
            </button>
          </div>
        </div>
      )}

      {/* Available Assignments */}
      {!currentQuestionnaire && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Available Questionnaires</h2>
            <button
              onClick={loadAssignments}
              disabled={loadingAssignments}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loadingAssignments ? "Loading..." : "Refresh"}
            </button>
          </div>

          {loadingAssignments ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading assignments...</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No questionnaires available for the specified course/module.</p>
              <p className="text-sm mt-2">Try creating sample data in the admin panel first.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {assignments.map((assignment) => (
                <div key={assignment.assignmentId} className="border rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{assignment.questionnaireTitle}</h3>
                      <p className="text-muted-foreground">
                        {assignment.scope.type === "course" ? "📚 Course-level" : "📖 Module-level"} • 
                        {assignment.timing === "pre" ? " Pre-completion" : " Post-completion"} survey
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-sm rounded-full ${
                        assignment.completed
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {assignment.completed ? "Completed ✓" : "Pending"}
                    </span>
                  </div>

                  {!assignment.completed && (
                    <button
                      onClick={() => startQuestionnaire(assignment.assignmentId)}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Start Questionnaire
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}