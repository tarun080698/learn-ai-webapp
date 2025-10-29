/**
 * Standardized Authentication Hook
 * Handles authenticated API calls with loading states, error handling, and automatic token management
 */
import { useCallback, useState } from "react";
import { useAuth } from "@/app/(auth)/AuthProvider";

export interface UseAuthenticatedFetchOptions extends RequestInit {
  skipAuth?: boolean; // For public endpoints
}

export interface AuthenticatedFetchState {
  loading: boolean;
  error: string | null;
}

export interface AuthenticatedFetchResult<T = unknown> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAuthenticatedFetch() {
  const { firebaseUser } = useAuth();

  const authenticatedFetch = useCallback(
    async (
      url: string,
      options: UseAuthenticatedFetchOptions = {}
    ): Promise<Response> => {
      const { skipAuth = false, ...fetchOptions } = options;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(fetchOptions.headers as Record<string, string>),
      };

      // Add authentication header if not skipping auth
      if (!skipAuth) {
        if (!firebaseUser) {
          throw new Error("User not authenticated");
        }

        try {
          const idToken = await firebaseUser.getIdToken();
          headers["Authorization"] = `Bearer ${idToken}`;
        } catch {
          throw new Error("Failed to get authentication token");
        }
      }

      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return response;
    },
    [firebaseUser]
  );

  return authenticatedFetch;
}

/**
 * Hook for API calls with automatic state management
 */
export function useAuthenticatedApi<T = unknown>(
  url: string,
  options: UseAuthenticatedFetchOptions = {}
): AuthenticatedFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const fetchData = useCallback(async () => {
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      const response = await authenticatedFetch(url, options);
      const result = await response.json();
      setData(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      console.error(`API Error (${url}):`, err);
    } finally {
      setLoading(false);
    }
  }, [url, authenticatedFetch, options]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * Hook for API mutations (POST, PUT, DELETE) with state management
 */
export function useAuthenticatedMutation<T = unknown, P = unknown>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const mutate = useCallback(
    async (
      url: string,
      payload?: P,
      options: UseAuthenticatedFetchOptions = {}
    ): Promise<T> => {
      setLoading(true);
      setError(null);

      try {
        const response = await authenticatedFetch(url, {
          method: "POST",
          ...options,
          body: payload ? JSON.stringify(payload) : options.body,
        });

        const result = await response.json();
        setLoading(false);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMessage);
        setLoading(false);
        throw err;
      }
    },
    [authenticatedFetch]
  );

  return {
    mutate,
    loading,
    error,
    reset: () => {
      setError(null);
      setLoading(false);
    },
  };
}

/**
 * Generic loading and error state hook for UI feedback
 */
export function useApiState() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const withApiState = useCallback(
    async <T>(apiCall: () => Promise<T>): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiCall();
        setLoading(false);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMessage);
        setLoading(false);
        return null;
      }
    },
    []
  );

  return {
    loading,
    error,
    setError,
    setLoading,
    withApiState,
    reset: () => {
      setError(null);
      setLoading(false);
    },
  };
}
