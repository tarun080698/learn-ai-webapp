/**
 * Admin Module Management Page
 * Add, edit, delete, and reorder modules within a course
 */
"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { useAuth } from "@/app/(auth)/AuthProvider";
import {
  useAuthenticatedFetch,
  useAuthenticatedMutation,
} from "@/hooks/useAuthenticatedFetch";
import { useFileUpload } from "@/hooks/useFileUpload";
import { ModuleDoc, CourseDoc } from "@/types/models";
import { QuestionnaireAssignmentModal } from "@/components/admin/QuestionnaireAssignmentModal";

interface Module extends ModuleDoc {
  id: string;
}

interface Course extends CourseDoc {
  id: string;
}

interface ModuleFormData {
  title: string;
  summary: string;
  contentType: "video" | "text" | "pdf" | "image" | "link";
  contentUrl: string;
  body: string;
  estMinutes: number;
}

export default function AdminModulesPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const { firebaseUser } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();
  const createModuleApi = useAuthenticatedMutation();
  const updateModuleApi = useAuthenticatedMutation();
  const {
    uploadFile,
    isUploading,
    progress,
    error: uploadError,
  } = useFileUpload();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<ModuleFormData>({
    title: "",
    summary: "",
    contentType: "video",
    contentUrl: "",
    body: "",
    estMinutes: 10,
  });

  // Load course and modules
  useEffect(() => {
    const loadData = async () => {
      if (!firebaseUser || !courseId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Load course details
        const courseResponse = await authenticatedFetch(
          `/api/admin/courses.mine?courseId=${courseId}`
        );
        const courseData = await courseResponse.json();

        if (!courseData.courses || courseData.courses.length === 0) {
          throw new Error("Course not found");
        }

        setCourse(courseData.courses[0]);

        // Load modules
        const modulesResponse = await authenticatedFetch(
          `/api/admin/modules.mine?courseId=${courseId}&orderBy=index&orderDirection=asc`
        );
        const modulesData = await modulesResponse.json();
        setModules(modulesData.modules || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [firebaseUser, courseId, authenticatedFetch]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields based on content type
    if (formData.contentType === "text" && !formData.body.trim()) {
      setError("Text content is required for text modules");
      return;
    }

    if (
      ["video", "pdf", "link", "image"].includes(formData.contentType) &&
      !formData.contentUrl.trim()
    ) {
      setError(`Content URL is required for ${formData.contentType} modules`);
      return;
    }

    try {
      const payload = {
        courseId,
        index: editingModule ? editingModule.index : modules.length,
        ...formData,
      };

      if (editingModule) {
        // Update existing module
        await updateModuleApi.mutate("/api/admin/module.upsert", {
          moduleId: editingModule.id,
          ...payload,
        });
      } else {
        // Create new module
        await createModuleApi.mutate("/api/admin/module.upsert", payload);
      }

      // Reload modules
      const modulesResponse = await authenticatedFetch(
        `/api/admin/modules.mine?courseId=${courseId}&orderBy=index&orderDirection=asc`
      );
      const modulesData = await modulesResponse.json();
      setModules(modulesData.modules || []);

      // Reset form
      resetForm();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save module");
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      summary: "",
      contentType: "video",
      contentUrl: "",
      body: "",
      estMinutes: 10,
    });
    setEditingModule(null);
    setShowForm(false);
  };

  // Handle edit
  const handleEdit = (module: Module) => {
    setFormData({
      title: module.title,
      summary: module.summary,
      contentType: module.contentType,
      contentUrl: module.contentUrl || "",
      body: module.body || "",
      estMinutes: module.estMinutes,
    });
    setEditingModule(module);
    setShowForm(true);
  };

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: name === "estMinutes" ? parseInt(value) || 0 : value,
      };

      // Clear contentUrl when content type changes to avoid invalid combinations
      if (name === "contentType" && value !== prev.contentType) {
        newData.contentUrl = "";
      }

      return newData;
    });
  };

  // Handle file upload for images
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Upload to Firebase Storage as asset type
      const result = await uploadFile(
        file,
        "asset",
        `Module ${formData.title || "image"} for course ${courseId}`
      );

      // Update form data with the uploaded file URL
      setFormData((prev) => ({
        ...prev,
        contentUrl: result.url,
      }));
    } catch (error) {
      console.error("File upload failed:", error);
      setError("Failed to upload image. Please try again.");
    }
  };

  // Reload modules after questionnaire changes
  const reloadModules = async () => {
    try {
      const modulesResponse = await authenticatedFetch(
        `/api/admin/modules.mine?courseId=${courseId}&orderBy=index&orderDirection=asc`
      );
      const modulesData = await modulesResponse.json();
      setModules(modulesData.modules || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reload modules");
    }
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
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-black">Loading modules...</div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="text-black mb-4">Course not found</div>
          <Link
            href="/admin"
            className="text-black hover:text-black border-b border-black"
          >
            ← Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href={`/admin/courses/${courseId}`}
            className="text-black hover:text-black border-b border-black  mb-2 inline-block"
          >
            ← Back to Course
          </Link>
          <h1 className="text-2xl font-bold text-black">Module Management</h1>
          <p className="text-black mt-1">{course.title}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-white text-black border border-black px-4 py-2 rounded-lg hover:bg-white transition-colors"
        >
          + Add Module
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-white border border-black text-black px-4 py-3 rounded-lg mb-6">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-black hover:text-black"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Modules List */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-black rounded-lg">
            <div className="p-4 border-b border-black">
              <h2 className="text-lg font-semibold text-black">
                Course Modules
              </h2>
              <p className=" text-black mt-1">{modules.length} modules</p>
            </div>

            {modules.length === 0 ? (
              <div className="text-center py-12 text-black">
                <div className="mb-4">No modules yet</div>
                <button
                  onClick={() => setShowForm(true)}
                  className="text-black hover:text-black border-b border-black"
                >
                  Add your first module
                </button>
              </div>
            ) : (
              <div className="divide-y divide-black">
                {modules.map((module, index) => (
                  <div key={module.id} className="p-4 hover:bg-white">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 w-8 h-8 bg-white text-black border border-black rounded-full flex items-center justify-center  font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-black">
                            {module.title}
                          </h3>
                          <p className=" text-black mt-1">{module.summary}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-black">
                            <span className="capitalize">
                              {module.contentType}
                            </span>
                            <span>{module.estMinutes}min</span>
                            {module.published && (
                              <span className="text-black">Published</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(module)}
                          className="text-black hover:text-black border-b border-black "
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedModuleId(module.id);
                            setShowQuestionnaireModal(true);
                          }}
                          className="text-black hover:text-black border-b border-black "
                        >
                          Questionnaire
                        </button>
                        <button className="text-black hover:text-black border-b border-black ">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Module Form */}
        {showForm && (
          <div className="lg:col-span-1">
            <div className="bg-white border border-black rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-black">
                  {editingModule ? "Edit Module" : "Add Module"}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-black hover:text-black"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="title"
                    className="block  font-medium text-black mb-1"
                  >
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  />
                </div>

                <div>
                  <label
                    htmlFor="summary"
                    className="block  font-medium text-black mb-1"
                  >
                    Summary
                  </label>
                  <textarea
                    id="summary"
                    name="summary"
                    value={formData.summary}
                    onChange={handleInputChange}
                    rows={2}
                    required
                    className="w-full bg-input border rounded-xl px-4 py-3 text-secondary focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-150"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contentType"
                    className="block  font-medium text-black mb-1"
                  >
                    Content Type
                  </label>
                  <select
                    id="contentType"
                    name="contentType"
                    value={formData.contentType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  >
                    <option value="video">Video</option>
                    <option value="text">Text</option>
                    <option value="pdf">PDF</option>
                    <option value="image">Image</option>
                    <option value="link">Link</option>
                  </select>
                </div>

                {/* Content URL field - only show for video, pdf, link */}
                {["video", "pdf", "link"].includes(formData.contentType) && (
                  <div>
                    <label
                      htmlFor="contentUrl"
                      className="block  font-medium text-black mb-1"
                    >
                      Content URL
                    </label>
                    <input
                      type="url"
                      id="contentUrl"
                      name="contentUrl"
                      value={formData.contentUrl}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                    />
                  </div>
                )}

                {/* Image upload field - only show for image content type */}
                {formData.contentType === "image" && (
                  <div>
                    <label
                      htmlFor="imageFile"
                      className="block  font-medium text-black mb-1"
                    >
                      Upload Image
                    </label>
                    <input
                      type="file"
                      id="imageFile"
                      name="imageFile"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="w-full px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                    />
                    {isUploading && (
                      <div className="mt-2  text-gray-600">
                        Uploading...{" "}
                        {progress ? Math.round(progress.percentage) : 0}%
                      </div>
                    )}
                    {uploadError && (
                      <div className="mt-2  text-red-600">
                        Upload error: {uploadError.message}
                      </div>
                    )}
                    {formData.contentUrl && (
                      <div className="mt-2">
                        <Image
                          src={formData.contentUrl}
                          alt="Preview"
                          width={200}
                          height={128}
                          className="max-w-xs max-h-32 object-contain border rounded"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Rich text content field - show for text and all other types except image */}
                {formData.contentType !== "image" && (
                  <div>
                    <label
                      htmlFor="body"
                      className="block  font-medium text-black mb-1"
                    >
                      {formData.contentType === "text"
                        ? "Text Content"
                        : "Additional Description (Optional)"}
                    </label>
                    <textarea
                      id="body"
                      name="body"
                      value={formData.body}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Rich text content... You can use Markdown here"
                      className="w-full bg-input border rounded-xl px-4 py-3 text-secondary focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-150"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Supports Markdown formatting
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="estMinutes"
                    className="block  font-medium text-black mb-1"
                  >
                    Estimated Minutes
                  </label>
                  <input
                    type="number"
                    id="estMinutes"
                    name="estMinutes"
                    value={formData.estMinutes}
                    onChange={handleInputChange}
                    min="1"
                    required
                    className="w-full px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  />
                </div>

                <button
                  type="submit"
                  disabled={createModuleApi.loading || updateModuleApi.loading}
                  className="w-full bg-white text-black border border-black py-2 px-4 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {createModuleApi.loading || updateModuleApi.loading
                    ? "Saving..."
                    : editingModule
                    ? "Update Module"
                    : "Add Module"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Module Questionnaire Assignment Modal */}
      {showQuestionnaireModal && selectedModuleId && (
        <QuestionnaireAssignmentModal
          isOpen={showQuestionnaireModal}
          onClose={() => {
            setShowQuestionnaireModal(false);
            setSelectedModuleId(null);
          }}
          onSuccess={() => {
            reloadModules();
            setShowQuestionnaireModal(false);
            setSelectedModuleId(null);
          }}
          courseId={courseId}
          moduleId={selectedModuleId}
          existingAssignments={[]} // TODO: Load module assignments
        />
      )}
    </div>
  );
}
