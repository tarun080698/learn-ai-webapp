import { z } from "zod";

// Phase 2: Zod schemas for validation

export const zCourseUpsert = z.object({
  courseId: z.string().optional(), // for update
  title: z.string().min(1),
  description: z.string().min(1),
  durationMinutes: z.number().int().nonnegative(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  heroImageUrl: z.string().url().optional(),
  published: z.boolean().optional(), // publish toggled in separate endpoint
  // Note: ownerUid is set by server from authenticated admin, not from client request
});

export const zModuleUpsert = z.object({
  moduleId: z.string().optional(), // for update
  courseId: z.string().min(1),
  index: z.number().int().min(0),
  title: z.string().min(1),
  summary: z.string().min(1),
  contentType: z.enum(["video", "text", "pdf", "link"]),
  contentUrl: z.string().url().optional(),
  body: z.string().optional(),
  estMinutes: z.number().int().min(1),
  // Note: ownerUid is inherited from parent course and set by server
});

export const zPublish = z.object({
  courseId: z.string().min(1),
  published: z.boolean(),
});

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

// Phase 3: Questionnaire System Schemas

export const zQuestionOption = z.object({
  id: z.string(),
  label: z.string(),
});

export const zQuestion = z.object({
  id: z.string(),
  type: z.enum(["single", "multi", "scale", "text"]),
  prompt: z.string(),
  options: z.array(zQuestionOption).optional(),
  scale: z
    .object({
      min: z.number(),
      max: z.number(),
      labels: z.record(z.number(), z.string()).optional(),
    })
    .optional(),
  required: z.boolean(),
  correct: z.array(z.string()).optional(),
  points: z.number().optional(),
});

export const zQuestionnaireUpsert = z.object({
  questionnaireId: z.string().optional(),
  title: z.string().min(1),
  purpose: z.enum(["survey", "quiz", "assessment"]),
  version: z.number().min(1),
  questions: z.array(zQuestion).min(1),
  // Note: ownerUid is set by server from authenticated admin
});

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

// Export types derived from schemas
export type Course = z.infer<typeof CourseSchema>;
export type Module = z.infer<typeof ModuleSchema>;
export type Enrollment = z.infer<typeof EnrollmentSchema>;
export type Progress = z.infer<typeof ProgressSchema>;
export type Questionnaire = z.infer<typeof QuestionnaireSchema>;
export type Assignment = z.infer<typeof AssignmentSchema>;
export type Response = z.infer<typeof ResponseSchema>;
export type User = z.infer<typeof UserSchema>;
export type LoginEvent = z.infer<typeof LoginEventSchema>;
