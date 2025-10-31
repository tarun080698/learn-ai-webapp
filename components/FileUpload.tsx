/**
 * FileUpload component
 * Reusable file upload with drag-and-drop, progress tracking, and validation
 */
"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useFileUpload, UploadResult } from "@/hooks/useFileUpload";
import {
  ALLOWED_TYPES,
  MAX_SIZES,
  validateFileUpload,
} from "@/lib/storage-client";

export interface FileUploadProps {
  type: "hero" | "asset";
  accept?: string;
  maxSize?: number;
  placeholder?: string;
  description?: string;
  disabled?: boolean;
  onUploadComplete?: (result: UploadResult) => void;
  onUploadError?: (error: { message: string; code?: string }) => void;
  className?: string;
}

export function FileUpload({
  type,
  accept,
  maxSize,
  placeholder,
  description,
  disabled = false,
  onUploadComplete,
  onUploadError,
  className = "",
}: FileUploadProps) {
  const [uploadDescription, setUploadDescription] = useState("");

  const { isUploading, progress, error, result, uploadFile, reset } =
    useFileUpload({
      onSuccess: onUploadComplete,
      onError: onUploadError,
    });

  // Determine allowed file types based on upload type
  const getAllowedTypes = () => {
    if (accept) return accept;

    if (type === "hero") {
      return ALLOWED_TYPES.images.join(",");
    } else {
      return [
        ...ALLOWED_TYPES.images,
        ...ALLOWED_TYPES.documents,
        ...ALLOWED_TYPES.videos,
      ].join(",");
    }
  };

  const getMaxSize = () => {
    if (maxSize) return maxSize;
    return type === "hero" ? MAX_SIZES.heroImage : MAX_SIZES.moduleAsset;
  };

  const handleDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled || isUploading) return;

      const file = acceptedFiles[0];
      if (!file) return;

      // Validate file
      const validation = validateFileUpload(file, type);
      if (!validation.valid) {
        onUploadError?.({ message: validation.error! });
        return;
      }

      try {
        await uploadFile(file, type, uploadDescription || undefined);
      } catch {
        // Error already handled by useFileUpload hook
      }
    },
    [disabled, isUploading, type, uploadDescription, uploadFile, onUploadError]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop: handleDrop,
      accept: {
        [getAllowedTypes()]: [],
      },
      maxSize: getMaxSize(),
      multiple: false,
      disabled: disabled || isUploading,
    });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusMessage = () => {
    if (result) {
      return (
        <div className="text-green-600 ">
          ✅ Uploaded: {result.metadata.originalName}
        </div>
      );
    }

    if (error) {
      return <div className="text-red-600 ">❌ {error.message}</div>;
    }

    if (isUploading && progress) {
      return (
        <div className="text-blue-600 ">
          Uploading... {progress.percentage}%
        </div>
      );
    }

    if (fileRejections.length > 0) {
      return (
        <div className="text-red-600 ">
          ❌ {fileRejections[0].errors[0].message}
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Description input */}
      {!result && (
        <div>
          <label className="block  font-medium text-gray-700 mb-1">
            Description (optional)
          </label>
          <input
            type="text"
            value={uploadDescription}
            onChange={(e) => setUploadDescription(e.target.value)}
            placeholder="Brief description of the file..."
            disabled={disabled || isUploading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>
      )}

      {/* Upload area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-300"}
          ${
            isUploading
              ? "bg-gray-50 cursor-not-allowed"
              : "hover:border-gray-400"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input {...getInputProps()} />

        {isUploading ? (
          <div className="space-y-2">
            <div className="text-blue-600">📤 Uploading...</div>
            {progress && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            )}
          </div>
        ) : result ? (
          <div className="space-y-2">
            <div className="text-green-600">✅ Upload Complete</div>
            <div className=" text-gray-600">
              {result.metadata.originalName} (
              {formatFileSize(result.metadata.size)})
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                reset();
                setUploadDescription("");
              }}
              className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
            >
              Upload another file
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-gray-600">
              {isDragActive
                ? "📁 Drop file here..."
                : placeholder || "📁 Click or drag file to upload"}
            </div>
            <div className="text-xs text-gray-500">
              Max size: {formatFileSize(getMaxSize())}
              <br />
              Allowed:{" "}
              {type === "hero" ? "Images only" : "Images, PDFs, Videos"}
            </div>
            {description && (
              <div className="text-xs text-gray-600 mt-2">{description}</div>
            )}
          </div>
        )}
      </div>

      {/* Status message */}
      {getStatusMessage()}
    </div>
  );
}
