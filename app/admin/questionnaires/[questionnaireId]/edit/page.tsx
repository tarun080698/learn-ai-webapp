/**
 * Admin Questionnaire Edit Page
 * Edit existing questionnaire using QuestionnaireBuilder component
 */
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { useAuth } from "@/app/(auth)/AuthProvider";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";
import { QuestionnaireBuilder } from "@/components/admin/QuestionnaireBuilder";
import { QuestionnaireDoc } from "@/types/models";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function AdminQuestionnaireEditPage() {
  const params = useParams();
  const router = useRouter();
  const questionnaireId = params.questionnaireId as string;
  const { firebaseUser } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();

  const [questionnaire, setQuestionnaire] = useState<
    (QuestionnaireDoc & { id: string }) | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load questionnaire data
  useEffect(() => {
    const loadQuestionnaire = async () => {
      if (!firebaseUser || !questionnaireId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch questionnaire details from admin questionnaires endpoint
        const response = await authenticatedFetch(
          `/api/admin/questionnaires.mine`
        );
        const data = await response.json();

        // Find the specific questionnaire
        const foundQuestionnaire = data.questionnaires?.find(
          (q: QuestionnaireDoc & { id: string }) => q.id === questionnaireId
        );

        if (!foundQuestionnaire) {
          throw new Error("Questionnaire not found");
        }

        setQuestionnaire({ ...foundQuestionnaire, id: questionnaireId });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load questionnaire"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestionnaire();
  }, [firebaseUser, questionnaireId, authenticatedFetch]);

  // Handle save questionnaire
  const handleSave = async (questionnaireData: Partial<QuestionnaireDoc>) => {
    if (!firebaseUser) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await authenticatedFetch(
        "/api/admin/questionnaire.upsert",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            questionnaireId: questionnaireId,
            ...questionnaireData,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update questionnaire");
      }

      // Redirect back to questionnaire view page
      router.push(`/admin/questionnaires/${questionnaireId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save questionnaire"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.push(`/admin/questionnaires/${questionnaireId}`);
  };

  if (!firebaseUser) {
    return (
      <div className="p-6">
        <div className="text-center" style={{ color: "var(--foreground)" }}>
          Please log in to continue.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderBottomColor: "var(--primary)" }}
          ></div>
          <p style={{ color: "var(--secondary-70)" }}>
            Loading questionnaire...
          </p>
        </div>
      </div>
    );
  }

  if (error && !questionnaire) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="text-center">
          <div className="mb-4" style={{ color: "var(--destructive)" }}>
            Error: {error}
          </div>
          <Link
            href="/admin/questionnaires"
            className="transition-colors"
            style={{ color: "var(--primary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--primary-80)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--primary)";
            }}
          >
            ← Back to Questionnaires
          </Link>
        </div>
      </div>
    );
  }

  if (!questionnaire) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="text-center">
          <div className="mb-4" style={{ color: "var(--secondary-70)" }}>
            Questionnaire not found
          </div>
          <Link
            href="/admin/questionnaires"
            className="transition-colors"
            style={{ color: "var(--primary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--primary-80)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--primary)";
            }}
          >
            ← Back to Questionnaires
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="max-w-7xl mx-auto p-6">
        {/* Header with Navigation */}
        <div
          className="rounded-2xl mb-6 p-6"
          style={{
            backgroundColor: "var(--card)",
            boxShadow:
              "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
            border: "1px solid var(--secondary-15)",
          }}
        >
          <div className="flex items-center gap-4">
            <Link
              href={`/admin/questionnaires/${questionnaireId}`}
              className="flex items-center gap-2 transition-colors"
              style={{ color: "var(--secondary-70)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--secondary-70)";
              }}
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Questionnaire
            </Link>
            <div
              className="w-px h-6"
              style={{ backgroundColor: "var(--secondary-20)" }}
            ></div>
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--secondary)" }}
            >
              Edit: {questionnaire.title}
            </h1>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div
            className="rounded-xl p-4 mb-6"
            style={{
              backgroundColor: "var(--destructive-10)",
              border: "1px solid var(--destructive-20)",
            }}
          >
            <div
              className="font-medium"
              style={{ color: "var(--destructive)" }}
            >
              Error
            </div>
            <div className=" mt-1" style={{ color: "var(--destructive-80)" }}>
              {error}
            </div>
          </div>
        )}

        {/* QuestionnaireBuilder Component */}
        <div style={{ backgroundColor: "var(--background)" }}>
          <QuestionnaireBuilder
            questionnaire={questionnaire}
            onSave={handleSave}
            onCancel={handleCancel}
            isLoading={isSaving}
          />
        </div>
      </div>
    </div>
  );
}
