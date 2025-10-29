/**
 * useQuestionnaires hook
 * Manages questionnaire CRUD operations and state
 */
import { useState, useCallback } from "react";
import { QuestionnaireDoc } from "@/types/models";
import {
  useAuthenticatedFetch,
  useAuthenticatedMutation,
} from "@/hooks/useAuthenticatedFetch";
import { useAuth } from "@/app/(auth)/AuthProvider";

export interface QuestionnaireWithId extends QuestionnaireDoc {
  id: string;
}

export interface UseQuestionnairesState {
  questionnaires: QuestionnaireWithId[];
  isLoading: boolean;
  error: string | null;
  isCreating: boolean;
  isUpdating: boolean;
}

export function useQuestionnaires() {
  const { firebaseUser } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();
  const createQuestionnaireMutation = useAuthenticatedMutation();
  const updateQuestionnaireMutation = useAuthenticatedMutation();

  const [state, setState] = useState<UseQuestionnairesState>({
    questionnaires: [],
    isLoading: false,
    error: null,
    isCreating: false,
    isUpdating: false,
  });

  // Fetch admin's questionnaires with standardized auth
  const fetchQuestionnaires = useCallback(
    async (filters?: { purpose?: string; limit?: number }) => {
      if (!firebaseUser) return [];

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const params = new URLSearchParams();
        if (filters?.purpose) params.append("purpose", filters.purpose);
        if (filters?.limit) params.append("limit", filters.limit.toString());

        const response = await authenticatedFetch(
          `/api/admin/questionnaires.mine?${params}`
        );
        const data = await response.json();

        setState((prev) => ({
          ...prev,
          questionnaires: data.questionnaires || [],
          isLoading: false,
        }));

        return data.questionnaires || [];
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to fetch questionnaires";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
        throw error;
      }
    },
    [firebaseUser, authenticatedFetch]
  );

  // Create new questionnaire with standardized auth
  const createQuestionnaire = useCallback(
    async (questionnaireData: Partial<QuestionnaireDoc>) => {
      setState((prev) => ({ ...prev, isCreating: true, error: null }));

      try {
        const data = await createQuestionnaireMutation.mutate(
          "/api/admin/questionnaire.upsert",
          questionnaireData
        );

        setState((prev) => ({ ...prev, isCreating: false }));

        // Refresh the list
        await fetchQuestionnaires();

        return data;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to create questionnaire";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isCreating: false,
        }));
        throw error;
      }
    },
    [createQuestionnaireMutation, fetchQuestionnaires]
  );

  // Update existing questionnaire with standardized auth
  const updateQuestionnaire = useCallback(
    async (
      questionnaireId: string,
      questionnaireData: Partial<QuestionnaireDoc>
    ) => {
      setState((prev) => ({ ...prev, isUpdating: true, error: null }));

      try {
        const data = await updateQuestionnaireMutation.mutate(
          "/api/admin/questionnaire.upsert",
          {
            ...questionnaireData,
            questionnaireId,
          }
        );

        setState((prev) => ({ ...prev, isUpdating: false }));

        // Refresh the list
        await fetchQuestionnaires();

        return data;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to update questionnaire";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isUpdating: false,
        }));
        throw error;
      }
    },
    [updateQuestionnaireMutation, fetchQuestionnaires]
  );

  // Get questionnaire by ID
  const getQuestionnaire = useCallback(
    (id: string) => {
      return state.questionnaires.find((q) => q.id === id);
    },
    [state.questionnaires]
  );

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Note: Components should call fetchQuestionnaires() manually when needed

  return {
    ...state,
    fetchQuestionnaires,
    createQuestionnaire,
    updateQuestionnaire,
    getQuestionnaire,
    clearError,
  };
}
