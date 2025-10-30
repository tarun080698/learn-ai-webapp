// =============================================================================
// Consolidated Type Definitions for Learn.ai 4all Platform
// =============================================================================
// This file contains all TypeScript interfaces and types used throughout the application.
// All interfaces have been consolidated here for consistency and maintainability.
//
// Last Updated: October 29, 2025
// =============================================================================

// Base types
export type FirestoreId = string;

// =============================================================================
// CORE DATABASE DOCUMENT INTERFACES
// =============================================================================

// User and Authentication Types
export interface UserDoc {
  uid: string; // Firebase Auth UID (matches doc ID)
  email?: string; // Primary email address
  displayName?: string; // Full name
  photoURL?: string; // Profile picture URL
  role: "user" | "admin"; // Authorization role
  currentStreakDays: number; // Current login streak
  bestStreakDays: number; // All-time best streak
  createdAt: FirebaseFirestore.Timestamp; // Account creation
  lastLoginAt: FirebaseFirestore.Timestamp; // Most recent login
  updatedAt: FirebaseFirestore.Timestamp; // Last profile update
  streakLastIncrementAt?: FirebaseFirestore.Timestamp; // Last streak increment
}

export interface AuthUser {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  role: "user" | "admin";
  provider?: string;
}

export interface ApiUser {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  role: "user" | "admin";
  currentStreakDays?: number;
  bestStreakDays?: number;
}

// Course System Types
export interface CourseDoc {
  ownerUid: string; // Admin who created and owns this course
  title: string;
  description: string;
  durationMinutes: number;
  level: "beginner" | "intermediate" | "advanced";
  published: boolean;
  publishedAt?: FirebaseFirestore.Timestamp;
  archived: boolean; // Soft delete flag
  archivedAt?: FirebaseFirestore.Timestamp;
  archivedBy?: string; // Admin UID who archived
  heroImageUrl?: string;
  moduleCount: number; // Denormalized count
  enrolledCount: number; // New counter field
  completedCount: number; // New counter field
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface ModuleAsset {
  id: string; // UUID
  kind: "pdf" | "video" | "image" | "link";
  url: string;
  title?: string;
  body?: string; // Rich text markdown description
  meta?: Record<string, unknown>; // Flexible metadata storage
  order: number;
}

export interface ModuleDoc {
  ownerUid: string; // Admin who owns this module (inherited from parent course)
  courseId: string;
  index: number; // 0..N unique per course
  title: string;
  summary: string;
  contentType: "video" | "text" | "pdf" | "image" | "link";
  contentUrl?: string; // Optional primary media URL
  body?: string; // Primary text content
  assets: ModuleAsset[]; // Optional secondary media
  estMinutes: number;
  published: boolean; // Mirrors course published
  archived: boolean; // Soft delete flag
  archivedAt?: FirebaseFirestore.Timestamp;
  archivedBy?: string; // Admin UID who archived
  createdAt: FirebaseFirestore.Timestamp; // Keep both timestamps
  updatedAt: FirebaseFirestore.Timestamp;
}

// Enrollment and Progress Types
export interface EnrollmentDoc {
  uid: string;
  courseId: string;
  enrolledAt: FirebaseFirestore.Timestamp;
  completed: boolean;
  lastModuleIndex: number; // Resume pointer
  completedCount: number; // Modules completed (denormalized)
  progressPct: number; // 0..100 integer
  preCourseComplete?: boolean; // Pre-course questionnaire gating
  postCourseComplete?: boolean; // Post-course questionnaire gating
}

export interface ProgressDoc {
  uid: string;
  courseId: string;
  moduleId: string;
  completed: boolean;
  completedAt?: FirebaseFirestore.Timestamp;
  preModuleComplete?: boolean; // Pre-module questionnaire gating
  postModuleComplete?: boolean; // Post-module questionnaire gating
}

// Questionnaire System Types (Updated for new create-and-assign flow)
export interface QuestionnaireQuestion {
  id: string; // Unique within questionnaire
  type: "single" | "multi" | "scale" | "text";
  prompt: string; // Question text
  required: boolean; // Validation flag
  options?: { id: string; label: string }[]; // For single/multi choice (structured format)
  scale?: {
    min: number;
    max: number;
    labels?: Record<number, string>; // Optional scale labels
  };
  correct?: string[]; // Correct option IDs for quiz scoring
  points?: number; // Point value for quiz questions (default 1)
}

// Type alias for convenience
export type Question = QuestionnaireQuestion;

export interface QuestionnaireDoc {
  ownerUid: string; // Admin who created this questionnaire
  title: string;
  purpose: "survey" | "quiz" | "assessment";
  questions: QuestionnaireQuestion[];
  archived: boolean; // Soft delete flag
  archivedAt?: FirebaseFirestore.Timestamp;
  archivedBy?: string; // Admin UID who archived
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  // Note: version field removed - new create-and-assign flow replaces versioning
}

export interface QuestionnaireAssignmentDoc {
  ownerUid: string; // Admin who created the assignment
  questionnaireId: string; // Template reference
  scope: {
    type: "course" | "module";
    courseId: string;
    moduleId?: string; // Required if type=module
  };
  timing: "pre" | "post"; // When to present questionnaire
  active: boolean; // Assignment enabled (allows temporary disabling)
  archived: boolean; // Soft delete flag
  archivedAt?: FirebaseFirestore.Timestamp;
  archivedBy?: string; // Admin UID who archived
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface QuestionnaireResponseDoc {
  uid: string; // User reference
  assignmentId: string; // Assignment reference
  questionnaireId: string; // Template reference (denormalized)
  scope: { type: "course" | "module"; courseId: string; moduleId?: string };
  answers: {
    questionId: string;
    value: string | number | string[] | number[]; // Answer value(s) based on question type
  }[];
  isComplete: boolean;
  score?: {
    earned: number; // Points earned
    total: number; // Total possible points
    percentage: number; // Percentage score (0-100)
  };
  submittedAt?: FirebaseFirestore.Timestamp; // Submission date
  createdAt: FirebaseFirestore.Timestamp; // Response creation (for started responses)
  updatedAt: FirebaseFirestore.Timestamp;
}

// System and Audit Types
export interface LoginEventDoc {
  uid: string; // User reference
  source: "web" | "mobile"; // Login source
  utcDate: string; // UTC date string (YYYY-MM-DD) for streak calculation
  timestamp: FirebaseFirestore.Timestamp; // Precise login time
}

export interface IdempotentWriteDoc {
  key: string; // Original idempotency key (client-provided)
  uid: string; // User who made the request
  endpoint: string; // API endpoint path
  result: Record<string, unknown>; // Cached successful response
  createdAt: FirebaseFirestore.Timestamp; // First request timestamp
  expiresAt: FirebaseFirestore.Timestamp; // Automatic cleanup time (24 hours)
}

export interface AdminAuditLogDoc {
  actorUid: string; // Admin who performed the action
  action: string; // Action performed
  target: {
    type: "course" | "module" | "questionnaire" | "assignment";
    id: string;
    title?: string;
  };
  before?: Record<string, unknown>; // State before change (optional)
  after?: Record<string, unknown>; // State after change (optional)
  timestamp: FirebaseFirestore.Timestamp;
}

// =============================================================================
// GRADING AND ASSESSMENT TYPES
// =============================================================================

export interface GradingResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  questionScores: QuestionScore[];
}

export interface QuestionScore {
  questionId: string;
  score: number;
  maxScore: number;
  correct: boolean;
}

// =============================================================================
// LEGACY INTERFACES (Deprecated - use Doc interfaces above)
// =============================================================================
// These are kept for backward compatibility but should not be used in new code

export interface Course {
  id: FirestoreId;
  // Legacy interface - use CourseDoc for new implementations
  placeholder?: unknown;
}

export interface Module {
  id: FirestoreId;
  courseId: FirestoreId;
  // Legacy interface - use ModuleDoc for new implementations
  placeholder?: unknown;
}

export interface Enrollment {
  id: FirestoreId;
  userId: FirestoreId;
  courseId: FirestoreId;
  // Legacy interface - use EnrollmentDoc for new implementations
  placeholder?: unknown;
}

export interface Progress {
  id: FirestoreId;
  userId: FirestoreId;
  moduleId: FirestoreId;
  // Legacy interface - use ProgressDoc for new implementations
  placeholder?: unknown;
}

export interface Questionnaire {
  id: FirestoreId;
  moduleId: FirestoreId;
  // Legacy interface - use QuestionnaireDoc for new implementations
  placeholder?: unknown;
}

export interface Assignment {
  id: FirestoreId;
  questionnaireId: FirestoreId;
  userId: FirestoreId;
  // Legacy interface - use AssignmentDoc for new implementations
  placeholder?: unknown;
}

export interface Response {
  id: FirestoreId;
  assignmentId: FirestoreId;
  userId: FirestoreId;
  // Legacy interface - use ResponseDoc for new implementations
  placeholder?: unknown;
}

export interface User {
  id: FirestoreId;
  email: string;
  // Legacy interface - use UserDoc for new implementations
  placeholder?: unknown;
}

export interface LoginEvent {
  id: FirestoreId;
  userId: FirestoreId;
  // Legacy interface - use LoginEventDoc for new implementations
  placeholder?: unknown;
}

// =============================================================================
// UTILITY AND HELPER TYPES
// =============================================================================

export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type QuestionType = "single" | "multi" | "scale" | "text";
export type ContentType = "video" | "text" | "pdf" | "image" | "link";
export type AssetKind = "pdf" | "video" | "image" | "link";
export type QuestionnairePurpose = "survey" | "quiz" | "assessment";
export type AssignmentTiming = "pre" | "post";
export type ScopeType = "course" | "module";
export type UserRole = "user" | "admin";

// API Response envelope types
export interface SuccessResponse<T = Record<string, unknown>> {
  ok: true;
  data?: T;
  [key: string]: unknown;
}

export interface ErrorResponse {
  ok: false;
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

export type ApiResponse<T = Record<string, unknown>> =
  | SuccessResponse<T>
  | ErrorResponse;

// Common error codes
export const ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: "unauthorized",
  FORBIDDEN: "forbidden",
  OWNERSHIP_MISMATCH: "ownership_mismatch",

  // Validation
  VALIDATION_ERROR: "validation_error",
  DUPLICATE_INDEX: "duplicate_index",

  // Business Logic
  COURSE_DELETE_BLOCKED: "course_delete_blocked",
  MODULE_DELETE_BLOCKED: "module_delete_blocked",
  PRE_MODULE_REQUIRED: "pre_module_required",
  POST_MODULE_REQUIRED: "post_module_required",

  // System
  TRANSACTION_FAILED: "transaction_failed",
  NOT_FOUND: "not_found",
  CONFLICT: "conflict",
  INTERNAL_ERROR: "internal_error",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
