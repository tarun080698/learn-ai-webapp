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
        <div className="text-center text-black">Please log in to continue.</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading questionnaire...</p>
        </div>
      </div>
    );
  }

  if (error && !questionnaire) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error: {error}</div>
          <Link
            href="/admin/questionnaires"
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Questionnaires
          </Link>
        </div>
      </div>
    );
  }

  if (!questionnaire) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 mb-4">Questionnaire not found</div>
          <Link
            href="/admin/questionnaires"
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Questionnaires
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header with Navigation */}
        <div className="bg-white rounded-lg shadow-sm border mb-6 p-6">
          <div className="flex items-center gap-4">
            <Link
              href={`/admin/questionnaires/${questionnaireId}`}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Questionnaire
            </Link>
            <div className="w-px h-6 bg-gray-300"></div>
            <h1 className="text-2xl font-bold text-gray-900">
              Edit: {questionnaire.title}
            </h1>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-800 font-medium">Error</div>
            <div className="text-red-700 text-sm mt-1">{error}</div>
          </div>
        )}

        {/* QuestionnaireBuilder Component */}
        <div className="bg-gray-50">
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
