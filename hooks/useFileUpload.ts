/**
 * useFileUpload hook
 * Handles file uploads with progress tracking and error handling
 */
import { useState, useCallback } from "react";
import { useAuth } from "@/app/(auth)/AuthProvider";

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  url: string;
  storagePath: string;
  metadata: {
    originalName: string;
    size: number;
    type: string;
    uploadType: "hero" | "asset";
    description: string | null;
  };
}

export interface UploadError {
  message: string;
  code?: string;
}

export interface UseFileUploadState {
  isUploading: boolean;
  progress: UploadProgress | null;
  error: UploadError | null;
  result: UploadResult | null;
}

export interface UseFileUploadOptions {
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: UploadError) => void;
  onProgress?: (progress: UploadProgress) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { firebaseUser } = useAuth();
  const [state, setState] = useState<UseFileUploadState>({
    isUploading: false,
    progress: null,
    error: null,
    result: null,
  });

  const uploadFile = useCallback(
    async (
      file: File,
      type: "hero" | "asset",
      description?: string
    ): Promise<UploadResult> => {
      if (!firebaseUser) {
        throw new Error("Authentication required for file upload");
      }

      setState({
        isUploading: true,
        progress: null,
        error: null,
        result: null,
      });

      try {
        // Get authentication token
        const token = await firebaseUser.getIdToken();

        // Create form data
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);
        if (description) {
          formData.append("description", description);
        }

        // Upload with progress tracking
        const result = await new Promise<UploadResult>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          // Track upload progress
          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const progress: UploadProgress = {
                loaded: event.loaded,
                total: event.total,
                percentage: Math.round((event.loaded / event.total) * 100),
              };

              setState((prev) => ({ ...prev, progress }));
              options.onProgress?.(progress);
            }
          });

          // Handle completion
          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                if (response.ok) {
                  resolve(response as UploadResult);
                } else {
                  reject(new Error(response.error || "Upload failed"));
                }
              } catch (e) {
                reject(new Error("Invalid response format"));
              }
            } else {
              try {
                const response = JSON.parse(xhr.responseText);
                reject(new Error(response.error || `HTTP ${xhr.status}`));
              } catch (e) {
                reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
              }
            }
          });

          // Handle errors
          xhr.addEventListener("error", () => {
            reject(new Error("Network error during upload"));
          });

          xhr.addEventListener("abort", () => {
            reject(new Error("Upload was cancelled"));
          });

          // Start upload with authentication
          xhr.open("POST", "/api/admin/upload");
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          xhr.send(formData);
        });

        setState({
          isUploading: false,
          progress: { loaded: file.size, total: file.size, percentage: 100 },
          error: null,
          result,
        });

        options.onSuccess?.(result);
        return result;
      } catch (error) {
        const uploadError: UploadError = {
          message: error instanceof Error ? error.message : "Upload failed",
          code: (error as any)?.code,
        };

        setState({
          isUploading: false,
          progress: null,
          error: uploadError,
          result: null,
        });

        options.onError?.(uploadError);
        throw uploadError;
      }
    },
    [options, firebaseUser]
  );

  const reset = useCallback(() => {
    setState({
      isUploading: false,
      progress: null,
      error: null,
      result: null,
    });
  }, []);

  return {
    ...state,
    uploadFile,
    reset,
  };
}
