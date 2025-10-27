import { Firestore, collection, CollectionReference } from "firebase/firestore";
import type { QuestionnaireQuestion } from "@/types/models";

// Phase 2 & 3: Collection name constants
export const COL = {
  courses: "courses",
  modules: "courseModules",
  enrollments: "enrollments",
  progress: "progress",
  questionnaires: "questionnaires",
  assignments: "questionnaireAssignments",
  responses: "questionnaireResponses",
};

// Legacy collection constants (keeping for backward compatibility)
export const COLLECTIONS = {
  COURSES: "courses",
  COURSE_MODULES: "courseModules",
  ENROLLMENTS: "enrollments",
  PROGRESS: "progress",
  QUESTIONNAIRES: "questionnaires",
  QUESTIONNAIRE_ASSIGNMENTS: "questionnaireAssignments",
  QUESTIONNAIRE_RESPONSES: "questionnaireResponses",
  USERS: "users",
  LOGIN_EVENTS: "loginEvents",
} as const;

// Collection type union
export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

/**
 * Get typed collection reference
 * TODO: Add stronger typing based on collection name
 */
export function col(
  db: Firestore,
  collectionName: CollectionName
): CollectionReference {
  return collection(db, collectionName);
}

// Phase 2: Firestore utility functions

export const enrollmentId = (uid: string, courseId: string) =>
  `${uid}_${courseId}`;
export const progressId = (uid: string, courseId: string, moduleId: string) =>
  `${uid}_${courseId}_${moduleId}`;

export async function getCourseModuleCount(
  db: FirebaseFirestore.Firestore,
  courseId: string
) {
  const snap = await db
    .collection(COL.modules)
    .where("courseId", "==", courseId)
    .get();
  return snap.size;
}

export async function recomputeCourseModuleCount(
  db: FirebaseFirestore.Firestore,
  courseId: string
) {
  const count = await getCourseModuleCount(db, courseId);
  const updateData: Partial<{ moduleCount: number; updatedAt: Date }> = {
    moduleCount: count,
    updatedAt: new Date(),
  };
  await db
    .collection(COL.courses)
    .doc(courseId)
    .set(updateData, { merge: true });
  return count;
}

// Phase 3: Questionnaire utility functions

export const responseId = (uid: string, assignmentId: string) =>
  `${uid}_${assignmentId}`;

export async function getAssignmentsForContext(
  db: FirebaseFirestore.Firestore,
  context: { courseId: string; moduleId?: string }
) {
  const assignmentsRef = db.collection(COL.assignments);

  // Get course-level assignments
  const courseAssignmentsQuery = assignmentsRef
    .where("scope.type", "==", "course")
    .where("scope.courseId", "==", context.courseId)
    .where("active", "==", true);

  const courseAssignmentsSnap = await courseAssignmentsQuery.get();

  let moduleAssignmentsSnap: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData> | null =
    null;

  // Get module-level assignments if moduleId provided
  if (context.moduleId) {
    const moduleAssignmentsQuery = assignmentsRef
      .where("scope.type", "==", "module")
      .where("scope.courseId", "==", context.courseId)
      .where("scope.moduleId", "==", context.moduleId)
      .where("active", "==", true);

    moduleAssignmentsSnap = await moduleAssignmentsQuery.get();
  }

  const result: {
    preCourse?: { assignmentId: string; timing: string };
    postCourse?: { assignmentId: string; timing: string };
    preModule?: { assignmentId: string; timing: string };
    postModule?: { assignmentId: string; timing: string };
  } = {};

  // Process course assignments
  courseAssignmentsSnap.docs.forEach((doc) => {
    const data = doc.data();
    if (data.timing === "pre") {
      result.preCourse = { assignmentId: doc.id, timing: data.timing };
    } else if (data.timing === "post") {
      result.postCourse = { assignmentId: doc.id, timing: data.timing };
    }
  });

  // Process module assignments
  if (moduleAssignmentsSnap) {
    moduleAssignmentsSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.timing === "pre") {
        result.preModule = { assignmentId: doc.id, timing: data.timing };
      } else if (data.timing === "post") {
        result.postModule = { assignmentId: doc.id, timing: data.timing };
      }
    });
  }

  return result;
}

export async function getAssignmentWithTemplate(
  db: FirebaseFirestore.Firestore,
  assignmentId: string
) {
  const assignmentDoc = await db
    .collection(COL.assignments)
    .doc(assignmentId)
    .get();
  if (!assignmentDoc.exists) {
    throw new Error(`Assignment ${assignmentId} not found`);
  }

  const assignmentData = assignmentDoc.data();
  if (!assignmentData) {
    throw new Error(`Assignment ${assignmentId} has no data`);
  }

  const questionnaireDoc = await db
    .collection(COL.questionnaires)
    .doc(assignmentData.questionnaireId)
    .get();
  if (!questionnaireDoc.exists) {
    throw new Error(
      `Questionnaire ${assignmentData.questionnaireId} not found`
    );
  }

  const questionnaireData = questionnaireDoc.data();
  if (!questionnaireData) {
    throw new Error(
      `Questionnaire ${assignmentData.questionnaireId} has no data`
    );
  }

  // Ensure we're using the frozen version
  if (questionnaireData.version !== assignmentData.questionnaireVersion) {
    throw new Error(
      `Version mismatch: assignment expects v${assignmentData.questionnaireVersion}, got v${questionnaireData.version}`
    );
  }

  return {
    assignment: { id: assignmentDoc.id, ...assignmentData },
    questionnaire: { id: questionnaireDoc.id, ...questionnaireData },
  };
}

export function gradeAnswers(
  questions: QuestionnaireQuestion[],
  answers: {
    questionId: string;
    value: string | number | string[] | number[];
  }[]
): { earned: number; total: number } {
  let earned = 0;
  let total = 0;

  const answerMap = new Map();
  answers.forEach((answer) => {
    answerMap.set(answer.questionId, answer.value);
  });

  questions.forEach((question) => {
    if (question.correct && question.points) {
      total += question.points;
      const userAnswer = answerMap.get(question.id);

      if (question.type === "single") {
        if (
          typeof userAnswer === "string" &&
          question.correct.includes(userAnswer)
        ) {
          earned += question.points;
        }
      } else if (question.type === "multi") {
        if (Array.isArray(userAnswer)) {
          // Check if arrays match exactly (all correct answers selected, no incorrect ones)
          const userSet = new Set(userAnswer);
          const correctSet = new Set(question.correct);
          if (
            userSet.size === correctSet.size &&
            [...userSet].every((x) => correctSet.has(x))
          ) {
            earned += question.points;
          }
        }
      }
    }
  });

  return { earned, total };
}

/**
 * Check if gating requirements are met for a specific action
 */
export async function checkGatingRequirements(
  db: FirebaseFirestore.Firestore,
  uid: string,
  action: {
    type: "start-module" | "complete-module" | "complete-course";
    courseId: string;
    moduleId?: string;
  }
) {
  const requirements = {
    preCourseComplete: false,
    preModuleComplete: false,
    postModuleComplete: false,
    postCourseComplete: false,
  };

  // Check enrollment document for course-level gating
  const enrollmentId = `${uid}_${action.courseId}`;
  const enrollmentDoc = await db
    .collection(COL.enrollments)
    .doc(enrollmentId)
    .get();
  const enrollment = enrollmentDoc.data();

  if (enrollment) {
    requirements.preCourseComplete = !!enrollment.preCourseComplete;
    requirements.postCourseComplete = !!enrollment.postCourseComplete;
  }

  // Check progress document for module-level gating (if moduleId provided)
  if (action.moduleId) {
    const progressId = `${uid}_${action.courseId}_${action.moduleId}`;
    const progressDoc = await db.collection(COL.progress).doc(progressId).get();
    const progress = progressDoc.data();

    if (progress) {
      requirements.preModuleComplete = !!progress.preModuleComplete;
      requirements.postModuleComplete = !!progress.postModuleComplete;
    }
  }

  return requirements;
}

/**
 * Check if user can start working on a module (pre-course and pre-module questionnaires completed)
 */
export async function canStartModule(
  db: FirebaseFirestore.Firestore,
  uid: string,
  courseId: string,
  moduleId: string
) {
  const requirements = await checkGatingRequirements(db, uid, {
    type: "start-module",
    courseId,
    moduleId,
  });

  // Get active assignments to check if pre-questionnaires are required
  const assignmentsQuery = db
    .collection(COL.assignments)
    .where("active", "==", true)
    .where("timing", "==", "pre");

  const assignmentsSnapshot = await assignmentsQuery.get();
  let requiresPreCourse = false;
  let requiresPreModule = false;

  assignmentsSnapshot.docs.forEach((doc) => {
    const assignment = doc.data();
    if (
      assignment.scope.type === "course" &&
      assignment.scope.courseId === courseId
    ) {
      requiresPreCourse = true;
    }
    if (
      assignment.scope.type === "module" &&
      assignment.scope.courseId === courseId &&
      assignment.scope.moduleId === moduleId
    ) {
      requiresPreModule = true;
    }
  });

  // Check if required questionnaires are completed
  if (requiresPreCourse && !requirements.preCourseComplete) {
    return { allowed: false, reason: "Pre-course questionnaire required" };
  }

  if (requiresPreModule && !requirements.preModuleComplete) {
    return { allowed: false, reason: "Pre-module questionnaire required" };
  }

  return { allowed: true };
}

/**
 * Check if user can complete a module (content completed + post-module questionnaire if required)
 */
export async function canCompleteModule(
  db: FirebaseFirestore.Firestore,
  uid: string,
  courseId: string,
  moduleId: string
) {
  // Check if post-module questionnaire is required and completed
  const assignmentsQuery = db
    .collection(COL.assignments)
    .where("active", "==", true)
    .where("timing", "==", "post")
    .where("scope.type", "==", "module")
    .where("scope.courseId", "==", courseId)
    .where("scope.moduleId", "==", moduleId);

  const assignmentsSnapshot = await assignmentsQuery.get();

  if (!assignmentsSnapshot.empty) {
    const requirements = await checkGatingRequirements(db, uid, {
      type: "complete-module",
      courseId,
      moduleId,
    });

    if (!requirements.postModuleComplete) {
      return { allowed: false, reason: "Post-module questionnaire required" };
    }
  }

  return { allowed: true };
}

export async function requireActiveAssignmentForContext(
  db: FirebaseFirestore.Firestore,
  assignmentId: string
) {
  const assignmentDoc = await db
    .collection(COL.assignments)
    .doc(assignmentId)
    .get();
  if (!assignmentDoc.exists) {
    throw new Error(`Assignment ${assignmentId} not found`);
  }

  const assignment = assignmentDoc.data();
  if (!assignment?.active) {
    throw new Error(`Assignment ${assignmentId} is not active`);
  }

  return { id: assignmentDoc.id, ...assignment };
}
