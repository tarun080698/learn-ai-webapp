import { z } from "zod";

// =============================================================================
// COMPREHENSIVE ZOD VALIDATION SCHEMAS - Updated for new backend system
// =============================================================================

// Course Management Schemas
export const zCourseUpsert = z.object({
  courseId: z.string().optional(), // for update
  title: z.string().min(1),
  description: z.string().min(1),
  durationMinutes: z.number().int().nonnegative(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  heroImageUrl: z.string().url().optional(),
  // Note: ownerUid is set by server from authenticated admin
});

export const zCoursePublish = z.object({
  courseId: z.string().min(1),
  published: z.boolean(),
});

export const zCourseArchive = z.object({
  courseId: z.string().min(1),
  archived: z.boolean(),
});

// Module Management Schemas
export const zModuleUpsert = z.object({
  moduleId: z.string().optional(), // for update
  courseId: z.string().min(1),
  index: z.number().int().min(0),
  title: z.string().min(1),
  summary: z.string().min(1),
  contentType: z.enum(["video", "text", "pdf", "image", "link"]), // Added 'image'
  contentUrl: z.string().url().optional(),
  body: z.string().optional(),
  estMinutes: z.number().int().min(1),
  // Note: ownerUid is inherited from parent course and set by server
});

export const zModulesReorder = z.object({
  courseId: z.string().min(1),
  order: z
    .array(
      z.object({
        moduleId: z.string().min(1),
        index: z.number().int().min(0),
      })
    )
    .min(1),
});

export const zModuleArchive = z.object({
  moduleId: z.string().min(1),
  archived: z.boolean(),
});

// Asset Management Schemas
export const zAssetAdd = z.object({
  moduleId: z.string().min(1),
  type: z.enum(["pdf", "video", "image", "link"]), // Direct type field to match UI
  title: z.string().min(1),
  description: z.string().optional(), // Match API expectation
  url: z.string().url(),
});

export const zAssetReorder = z.object({
  moduleId: z.string().min(1),
  order: z
    .array(
      z.object({
        assetId: z.string().min(1),
        order: z.number().int().min(0),
      })
    )
    .min(1),
});

export const zAssetRemove = z.object({
  moduleId: z.string().min(1),
  assetId: z.string().min(1),
});

// Legacy publish schema (keeping for backward compatibility)
export const zPublish = z.object({
  courseId: z.string().min(1),
  published: z.boolean(),
});

// User Workflow Schemas (keep existing)
export const zEnroll = z.object({
  courseId: z.string().min(1),
});

export const zProgressComplete = z.object({
  courseId: z.string().min(1),
  moduleId: z.string().min(1),
  moduleIndex: z.number().int().min(0),
});

// Legacy schemas (keeping for backward compatibility)
export const CourseSchema = z.object({
  id: z.string(),
  // Legacy schema - use CourseDocSchema for new implementations
  placeholder: z.any(),
});

export const ModuleSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  // Legacy schema - use ModuleDocSchema for new implementations
  placeholder: z.any(),
});

export const EnrollmentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  courseId: z.string(),
  // Legacy schema - use EnrollmentDocSchema for new implementations
  placeholder: z.any(),
});

export const ProgressSchema = z.object({
  id: z.string(),
  userId: z.string(),
  moduleId: z.string(),
  // Legacy schema - use ProgressDocSchema for new implementations
  placeholder: z.any(),
});

export const QuestionnaireSchema = z.object({
  id: z.string(),
  moduleId: z.string(),
  // TODO: Add questionnaire properties - questions, settings, etc.
  placeholder: z.any(),
});

export const AssignmentSchema = z.object({
  id: z.string(),
  questionnaireId: z.string(),
  userId: z.string(),
  // TODO: Add assignment properties - dueDate, attempts, etc.
  placeholder: z.any(),
});

export const ResponseSchema = z.object({
  id: z.string(),
  assignmentId: z.string(),
  userId: z.string(),
  // TODO: Add response properties - answers, submittedAt, score, etc.
  placeholder: z.any(),
});

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  // TODO: Add user properties - name, role, preferences, etc.
  placeholder: z.any(),
});

export const LoginEventSchema = z.object({
  id: z.string(),
  userId: z.string(),
  // Legacy schema - login event tracking not implemented
  placeholder: z.any(),
});

// Questionnaire System Schemas (Updated for create-and-assign flow)
export const zQuestionOption = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});

export const zQuestion = z.object({
  id: z.string().min(1),
  type: z.enum(["single", "multi", "scale", "text"]),
  prompt: z.string().min(1),
  options: z.array(zQuestionOption).optional(),
  scale: z
    .object({
      min: z.number().int(),
      max: z.number().int(),
      labels: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
  required: z.boolean(),
  correct: z.array(z.string()).optional(),
  points: z.number().int().min(1).optional(),
});

// New create-and-assign flow schema
export const zQuestionnaireCreateAndAssign = z.object({
  title: z.string().min(1),
  purpose: z.enum(["survey", "quiz", "assessment"]),
  questions: z.array(zQuestion).min(1),
  scope: z.object({
    type: z.enum(["course", "module"]),
    courseId: z.string().min(1),
    moduleId: z.string().min(1).optional(),
  }),
  timing: z.enum(["pre", "post"]),
  // Note: ownerUid is set by server from authenticated admin
});

// Assignment management schemas
export const zAssignmentUpdate = z.object({
  assignmentId: z.string().min(1),
  // Within same course only: allow course<->module, pre<->post
  scope: z
    .object({
      type: z.enum(["course", "module"]),
      courseId: z.string().min(1),
      moduleId: z.string().min(1).optional(),
    })
    .optional(),
  timing: z.enum(["pre", "post"]).optional(),
  active: z.boolean().optional(),
});

export const zAssignmentArchive = z.object({
  assignmentId: z.string().min(1),
  archived: z.boolean(),
});

export const zAssignmentDelete = z.object({
  assignmentId: z.string().min(1),
});

// Legacy questionnaire schema (deprecated - use create-and-assign flow)
export const zQuestionnaireUpsert = z.object({
  questionnaireId: z.string().optional(),
  title: z.string().min(1),
  purpose: z.enum(["survey", "quiz", "assessment"]),
  questions: z.array(zQuestion).min(1),
  // Note: ownerUid is set by server from authenticated admin
});

// Legacy assignment schema (deprecated - use create-and-assign flow)
export const zAssignmentUpsert = z.object({
  assignmentId: z.string().optional(),
  questionnaireId: z.string(),
  scope: z.object({
    type: z.enum(["course", "module"]),
    courseId: z.string(),
    moduleId: z.string().optional(),
  }),
  timing: z.enum(["pre", "post"]),
  active: z.boolean().optional(),
});

export const zStart = z.object({
  assignmentId: z.string(),
});

export const zSubmit = z.object({
  assignmentId: z.string(),
  answers: z.array(
    z.object({
      questionId: z.string(),
      // For single/multi choice: option IDs; for text/number/scale: actual values
      value: z.union([z.string(), z.number(), z.array(z.string())]),
    })
  ),
});

// =============================================================================
// EXPORT TYPES DERIVED FROM SCHEMAS
// =============================================================================

// New schema types
export type CourseUpsertInput = z.infer<typeof zCourseUpsert>;
export type CoursePublishInput = z.infer<typeof zCoursePublish>;
export type CourseArchiveInput = z.infer<typeof zCourseArchive>;
export type ModuleUpsertInput = z.infer<typeof zModuleUpsert>;
export type ModulesReorderInput = z.infer<typeof zModulesReorder>;
export type ModuleArchiveInput = z.infer<typeof zModuleArchive>;
export type AssetAddInput = z.infer<typeof zAssetAdd>;
export type AssetReorderInput = z.infer<typeof zAssetReorder>;
export type AssetRemoveInput = z.infer<typeof zAssetRemove>;
export type QuestionnaireCreateAndAssignInput = z.infer<
  typeof zQuestionnaireCreateAndAssign
>;
export type AssignmentUpdateInput = z.infer<typeof zAssignmentUpdate>;
export type AssignmentArchiveInput = z.infer<typeof zAssignmentArchive>;
export type AssignmentDeleteInput = z.infer<typeof zAssignmentDelete>;
export type EnrollInput = z.infer<typeof zEnroll>;
export type ProgressCompleteInput = z.infer<typeof zProgressComplete>;
export type StartInput = z.infer<typeof zStart>;
export type SubmitInput = z.infer<typeof zSubmit>;

// Legacy schema types (deprecated - use types from types/types.ts)
export type Course = z.infer<typeof CourseSchema>;
export type Module = z.infer<typeof ModuleSchema>;
export type Enrollment = z.infer<typeof EnrollmentSchema>;
export type Progress = z.infer<typeof ProgressSchema>;
export type Questionnaire = z.infer<typeof QuestionnaireSchema>;
export type Assignment = z.infer<typeof AssignmentSchema>;
export type Response = z.infer<typeof ResponseSchema>;
export type User = z.infer<typeof UserSchema>;
export type LoginEvent = z.infer<typeof LoginEventSchema>;
