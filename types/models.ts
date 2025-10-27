// Base types
export type FirestoreId = string;

// Phase 2: Course & Module Learning System

export interface CourseDoc {
  title: string;
  description: string;
  durationMinutes: number;
  level: "beginner" | "intermediate" | "advanced";
  published: boolean;
  heroImageUrl?: string;
  moduleCount: number;
  publishedAt?: FirebaseFirestore.Timestamp;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface ModuleDoc {
  courseId: string;
  index: number; // 0..N unique per course
  title: string;
  summary: string;
  contentType: "video" | "text" | "pdf" | "link";
  contentUrl?: string;
  body?: string;
  estMinutes: number;
  published: boolean; // mirrors course published
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface EnrollmentDoc {
  uid: string;
  courseId: string;
  enrolledAt: FirebaseFirestore.Timestamp;
  completed: boolean;
  lastModuleIndex: number; // resume pointer
  completedCount: number;
  progressPct: number; // 0..100 integer
  preCourseComplete?: boolean;
  postCourseComplete?: boolean;
}

export interface ProgressDoc {
  uid: string;
  courseId: string;
  moduleId: string;
  completed: boolean;
  completedAt?: FirebaseFirestore.Timestamp;
  preModuleComplete?: boolean;
  postModuleComplete?: boolean;
}

// Phase 3: Questionnaire System Types

export interface QuestionnaireQuestion {
  id: string; // stable within the template version
  type: "single" | "multi" | "scale" | "text";
  prompt: string;
  options?: { id: string; label: string }[]; // single/multi
  scale?: { min: number; max: number; labels?: Record<number, string> };
  required: boolean;
  correct?: string[]; // quiz only
  points?: number; // default 1 if quiz
}

export interface QuestionnaireDoc {
  title: string;
  purpose: "survey" | "quiz" | "mixed";
  version: number;
  questions: QuestionnaireQuestion[];
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface QuestionnaireAssignmentDoc {
  questionnaireId: string;
  questionnaireVersion: number; // frozen at assign time
  scope: { type: "course" | "module"; courseId: string; moduleId?: string };
  timing: "pre" | "post";
  active: boolean;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface QuestionnaireResponseDoc {
  uid: string;
  assignmentId: string;
  questionnaireId: string;
  questionnaireVersion: number;
  scope: { type: "course" | "module"; courseId: string; moduleId?: string };
  answers: {
    questionId: string;
    value: string | number | string[] | number[];
  }[];
  isComplete: boolean;
  score?: { earned: number; total: number };
  submittedAt?: FirebaseFirestore.Timestamp;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

// Legacy interfaces (keeping for backward compatibility)
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
  // TODO: Add questionnaire properties - questions, settings, etc.
  placeholder?: unknown;
}

export interface Assignment {
  id: FirestoreId;
  questionnaireId: FirestoreId;
  userId: FirestoreId;
  // TODO: Add assignment properties - dueDate, attempts, etc.
  placeholder?: unknown;
}

export interface Response {
  id: FirestoreId;
  assignmentId: FirestoreId;
  userId: FirestoreId;
  // TODO: Add response properties - answers, submittedAt, score, etc.
  placeholder?: unknown;
}

export interface User {
  id: FirestoreId;
  email: string;
  // TODO: Add user properties - name, role, preferences, etc.
  placeholder?: unknown;
}

export interface LoginEvent {
  id: FirestoreId;
  userId: FirestoreId;
  // TODO: Add login event properties - timestamp, IP, userAgent, etc.
  placeholder?: unknown;
}
