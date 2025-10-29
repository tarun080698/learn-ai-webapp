// =============================================================================
// Legacy models.ts - Re-export from consolidated types
// =============================================================================
// This file is kept for backward compatibility.
// All type definitions have been moved to types/types.ts
// New code should import from types/types.ts directly.

// Re-export all types from the consolidated types file
export * from "./types";

// Legacy compatibility - these exports maintain existing import paths
export type {
  // Core document types
  CourseDoc,
  ModuleDoc,
  EnrollmentDoc,
  ProgressDoc,
  QuestionnaireDoc,
  QuestionnaireAssignmentDoc,
  QuestionnaireResponseDoc,
  UserDoc,
  LoginEventDoc,
  IdempotentWriteDoc,

  // Helper types
  QuestionnaireQuestion,
  Question,
  ModuleAsset,
  AuthUser,
  ApiUser,
  GradingResult,
  QuestionScore,

  // Legacy interfaces (deprecated)
  Course,
  Module,
  Enrollment,
  Progress,
  Questionnaire,
  Assignment,
  Response,
  User,
  LoginEvent,

  // Utility types
  FirestoreId,
  CourseLevel,
  QuestionType,
  ContentType,
  AssetKind,
  QuestionnairePurpose,
  AssignmentTiming,
  ScopeType,
  UserRole,
  ApiResponse,
  SuccessResponse,
  ErrorResponse,
  ErrorCode,
} from "./types";
