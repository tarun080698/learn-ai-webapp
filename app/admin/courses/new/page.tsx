"use client";

import { EnhancedCourseWizard } from "@/components/admin/EnhancedCourseWizard";
import { useRouter } from "next/navigation";

export default function NewCoursePage() {
  const router = useRouter();

  const handleComplete = (result: { courseId: string; isUpdate: boolean }) => {
    // Redirect to course management or preview
    router.push(`/admin/courses/${result.courseId}`);
  };

  const handleCancel = () => {
    // Go back to admin dashboard
    router.push("/admin");
  };

  return (
    <EnhancedCourseWizard
      mode="create"
      onComplete={handleComplete}
      onCancel={handleCancel}
    />
  );
}
