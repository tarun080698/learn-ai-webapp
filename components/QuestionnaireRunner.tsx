"use client";

import { useEffect, useState } from "react";
import { useAuthenticatedMutation } from "@/hooks/useAuthenticatedFetch";
import { generateIdempotencyKey } from "@/utils/uuid";

export interface QuestionnaireQuestion {
  id: string;
  type: "single" | "multi" | "scale" | "text";
  prompt: string;
  options?: { id: string; label: string }[];
  scale?: { min: number; max: number; labels?: Record<number, string> };
  required: boolean;
}

export interface StartedQuestionnaire {
  assignment: {
    id: string;
    questionnaireId: string;
    questionnaireVersion?: number;
    scope: { type: "course" | "module"; courseId: string; moduleId?: string };
    timing: "pre" | "post";
    active: boolean;
  };
  questionnaire: {
    id: string;
    title: string;
    purpose: "survey" | "quiz" | "assessment" | "mixed";
    questions: QuestionnaireQuestion[];
    version?: number;
  };
}

export interface QuestionnaireSubmissionResult {
  ok?: boolean;
  responseId?: string;
  score?: { earned: number; total: number };
}

interface QuestionnaireRunnerProps {
  assignmentId: string;
  onComplete: (result: QuestionnaireSubmissionResult) => void;
  onCancel?: () => void;
  /** Hide the title/header strip (useful when rendered inside another card). */
  embedded?: boolean;
}

type AnswerValue = string | number | string[];

export function QuestionnaireRunner({
  assignmentId,
  onComplete,
  onCancel,
  embedded = false,
}: QuestionnaireRunnerProps) {
  const startApi = useAuthenticatedMutation();
  const submitApi = useAuthenticatedMutation();

  const [started, setStarted] = useState<StartedQuestionnaire | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuestionnaireSubmissionResult | null>(
    null
  );

  // Fetch the questionnaire whenever assignmentId changes.
  useEffect(() => {
    let cancelled = false;
    setStarted(null);
    setAnswers({});
    setError(null);
    setResult(null);

    (async () => {
      try {
        const data = (await startApi.mutate("/api/questionnaires/start", {
          assignmentId,
        })) as StartedQuestionnaire;
        if (!cancelled) setStarted(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load questionnaire"
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // startApi is stable enough; we re-run only on assignmentId change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  const updateAnswer = (questionId: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (!started) return;
    setError(null);
    try {
      const formattedAnswers = started.questionnaire.questions
        .map((q) => {
          const value = answers[q.id];
          if (value === undefined || value === "") return null;
          return { questionId: q.id, value };
        })
        .filter(Boolean);

      const idempotencyKey = generateIdempotencyKey();
      const data = (await submitApi.mutate(
        "/api/questionnaires/submit",
        {
          assignmentId: started.assignment.id,
          answers: formattedAnswers,
        },
        { headers: { "x-idempotency-key": idempotencyKey } }
      )) as QuestionnaireSubmissionResult;

      setResult(data);
      onComplete(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    }
  };

  if (startApi.loading || !started) {
    return (
      <div className="py-12 text-center">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto"
          style={{ borderColor: "var(--primary)" }}
        ></div>
        <p
          className="mt-3 text-sm"
          style={{ color: "var(--muted-foreground)" }}
        >
          Loading questionnaire…
        </p>
        {error && (
          <p className="mt-3 text-sm" style={{ color: "var(--destructive)" }}>
            {error}
          </p>
        )}
      </div>
    );
  }

  const { questionnaire } = started;

  if (result) {
    return (
      <div className="py-6">
        <h3
          className="text-xl font-semibold mb-2"
          style={{ color: "var(--secondary)" }}
        >
          Submitted ✓
        </h3>
        {result.score ? (
          <p style={{ color: "var(--secondary)" }}>
            Score: <strong>{result.score.earned}</strong> /{" "}
            {result.score.total}
          </p>
        ) : (
          <p style={{ color: "var(--muted-foreground)" }}>
            Thanks for completing this questionnaire.
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      {!embedded && (
        <header className="flex items-start justify-between mb-6 gap-3">
          <div>
            <h2
              className="text-2xl font-bold"
              style={{ color: "var(--secondary)" }}
            >
              {questionnaire.title}
            </h2>
            <p
              className="text-sm mt-1"
              style={{ color: "var(--muted-foreground)" }}
            >
              {questionnaire.purpose === "survey"
                ? "Survey"
                : questionnaire.purpose === "quiz"
                ? "Quiz"
                : questionnaire.purpose === "assessment"
                ? "Assessment"
                : "Mixed"}
              {questionnaire.questions.length} question
              {questionnaire.questions.length === 1 ? "" : "s"}
            </p>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-3 py-1 rounded text-sm border"
              style={{
                borderColor: "var(--border)",
                color: "var(--secondary)",
              }}
            >
              Cancel
            </button>
          )}
        </header>
      )}

      <div className="space-y-6">
        {questionnaire.questions.map((question, index) => (
          <div key={question.id}>
            <div className="flex items-start gap-2 mb-2">
              <span
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-foreground)",
                }}
              >
                {index + 1}
              </span>
              <h3
                className="font-semibold"
                style={{ color: "var(--secondary)" }}
              >
                {question.prompt}
                {question.required && (
                  <span style={{ color: "var(--destructive)" }} className="ml-1">
                    *
                  </span>
                )}
              </h3>
            </div>
            <div className="ml-9">
              <QuestionInput
                question={question}
                value={answers[question.id]}
                onChange={(v) => updateAnswer(question.id, v)}
              />
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p
          className="mt-4 text-sm"
          style={{ color: "var(--destructive)" }}
        >
          {error}
        </p>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={submitApi.loading}
          className="px-5 py-2 rounded-lg font-semibold disabled:opacity-60"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
        >
          {submitApi.loading ? "Submitting…" : "Submit"}
        </button>
      </div>
    </div>
  );
}

interface QuestionInputProps {
  question: QuestionnaireQuestion;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
}

function QuestionInput({ question, value, onChange }: QuestionInputProps) {
  switch (question.type) {
    case "single":
      return (
        <div className="space-y-2">
          {question.options?.map((option) => (
            <label
              key={option.id}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="radio"
                name={question.id}
                value={option.id}
                checked={value === option.id}
                onChange={(e) => onChange(e.target.value)}
              />
              <span style={{ color: "var(--secondary)" }}>{option.label}</span>
            </label>
          ))}
        </div>
      );
    case "multi": {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="space-y-2">
          {question.options?.map((option) => {
            const checked = arr.includes(option.id);
            return (
              <label
                key={option.id}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    if (e.target.checked) onChange([...arr, option.id]);
                    else onChange(arr.filter((v) => v !== option.id));
                  }}
                />
                <span style={{ color: "var(--secondary)" }}>{option.label}</span>
              </label>
            );
          })}
        </div>
      );
    }
    case "scale": {
      const min = question.scale?.min ?? 1;
      const max = question.scale?.max ?? 5;
      const current = typeof value === "number" ? value : min;
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span
              className="text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              {question.scale?.labels?.[min] ?? min}
            </span>
            <input
              type="range"
              min={min}
              max={max}
              step={1}
              value={current}
              onChange={(e) => onChange(parseInt(e.target.value, 10))}
              className="flex-1"
            />
            <span
              className="text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              {question.scale?.labels?.[max] ?? max}
            </span>
          </div>
          <div
            className="text-center text-sm font-medium"
            style={{ color: "var(--secondary)" }}
          >
            Selected: {current}
          </div>
        </div>
      );
    }
    case "text":
    default:
      return (
        <textarea
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          placeholder="Enter your response…"
          className="w-full p-3 border rounded-lg resize-vertical"
          style={{
            borderColor: "var(--border)",
            color: "var(--secondary)",
            backgroundColor: "var(--card)",
          }}
        />
      );
  }
}
