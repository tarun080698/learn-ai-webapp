export interface AdminCourse {
  id: string;
  title: string;
  description?: string;
  heroImageUrl?: string;
  published: boolean;
  archived: boolean;
  updatedAt: string; // ISO
  moduleCount: number; // may be modules?.length if not denormalized
  enrolledCount: number; // denormalized counter on course
  completedCount: number; // denormalized counter on course
}

export interface CourseStats {
  totalCourses: number;
  totalEnrollments: number;
  totalCompletions: number;
}
