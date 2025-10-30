// Additional types for Create Course Wizard
export type Level = "beginner" | "intermediate" | "advanced"; // Match database schema
export type ContentType = "pdf" | "video" | "image" | "link" | "text";
export type AssetType = "pdf" | "video" | "image" | "link";
export type AssignmentTiming = "pre" | "post";

export interface CourseDraft {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number; // convert from hours input
  level: Level;
  heroImageUrl?: string;
  published: false;
}

export interface ModuleDoc {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  estMinutes?: number;
  // primary content (optional)
  contentType?: ContentType; // 'text' allowed here
  contentUrl?: string; // for pdf/video/image/link
  body?: string; // for 'text'
  order: number;
}

export interface AssetDoc {
  id: string;
  moduleId: string;
  type: AssetType;
  title: string;
  description?: string;
  url: string;
  order: number;
}

export type AssignmentScope =
  | { type: "course"; courseId: string }
  | { type: "module"; courseId: string; moduleId: string };

export interface AssignmentUpsertInput {
  scope: AssignmentScope;
  timing: AssignmentTiming;
  questionnaireId: string;
  active: boolean;
}

export interface QuestionnaireItem {
  id: string;
  name: string;
  title?: string;
  questions?: Array<{ id: string; question: string }>;
  meta?: Record<string, unknown>;
}

// API Response types
export interface UploadResponse {
  url: string;
}

export interface CourseUpsertResponse {
  ok: boolean;
  id: string;
  isUpdate: boolean;
}

export interface ModuleUpsertResponse {
  ok: boolean;
  moduleId: string;
  moduleCount: number;
  isUpdate: boolean;
}

export interface AssetAddResponse {
  id: string;
}

export interface QuestionnairesResponse {
  items: QuestionnaireItem[];
}

export interface GenericResponse {
  ok: true;
}

// Form validation types
export interface CourseFormData {
  title: string;
  description?: string;
  durationHours: number; // UI field
  level: Level;
  heroImageUrl?: string;
}

export interface ModuleFormData {
  title: string;
  description?: string;
  estMinutes?: number;
  contentType?: ContentType;
  contentUrl?: string;
  body?: string;
}

export interface AssetFormData {
  type: AssetType; // Keep 'type' for UI consistency
  title: string;
  body?: string; // Rich text markdown description
  url: string;
  order: number;
  meta?: Record<string, unknown>;
}

// Wizard state
export interface WizardState {
  currentStep: number;
  courseId?: string;
  courseData: Partial<CourseFormData>;
  modules: (ModuleFormData & {
    id?: string;
    assets?: (AssetFormData & { id?: string })[];
  })[];
  questionnaires?: {
    title: string;
    description?: string;
    questions: {
      id?: string;
      question: string;
      type: "multiple-choice" | "text" | "rating";
      options?: string[];
      required: boolean;
    }[];
  }[];
  assignments: {
    course: {
      pre?: { questionnaireId: string; active: boolean };
      post?: { questionnaireId: string; active: boolean };
    };
    modules: Record<
      string,
      {
        pre?: { questionnaireId: string; active: boolean };
        post?: { questionnaireId: string; active: boolean };
      }
    >;
  };
}

export interface WizardStepProps {
  courseId?: string;
  wizardState: WizardState;
  onUpdate: (updates: Partial<WizardState>) => void;
  onNext: () => void;
  onPrevious: () => void;
  onComplete?: (result: { courseId: string; isUpdate: boolean }) => void;
}
