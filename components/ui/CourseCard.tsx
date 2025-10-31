"use client";

import Link from "next/link";
import Image from "next/image";

// Types for the course card component
export interface CourseCardData {
  id: string;
  title: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  durationMinutes: number;
  moduleCount: number;
  heroImageUrl?: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  studentCount?: number;
  // Enrollment related fields
  enrolled?: boolean;
  enrollmentId?: string | null;
  progressPct?: number;
  completed?: boolean;
  // Admin specific fields
  published?: boolean;
  archived?: boolean;
  createdAt?: string;
  updatedAt?: string;
  enrolledCount?: number;
}

export interface CourseCardAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant: "primary" | "secondary" | "outline" | "danger";
  disabled?: boolean;
}

export interface CourseCardProps {
  course: CourseCardData;
  actions?: CourseCardAction[];
  showImage?: boolean;
  showStats?: boolean;
  showProgress?: boolean;
  showStatus?: boolean;
  layout?: "horizontal" | "vertical";
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Helper functions
const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins > 0 ? ` ${mins}m` : ""}`;
  }
  return `${mins}m`;
};

const getLevelColor = (level: string) => {
  switch (level) {
    case "beginner":
      return { backgroundColor: "var(--primary-10)", color: "var(--primary)" };
    case "intermediate":
      return { backgroundColor: "var(--accent-10)", color: "var(--accent)" };
    case "advanced":
      return {
        backgroundColor: "var(--destructive-10)",
        color: "var(--destructive)",
      };
    default:
      return {
        backgroundColor: "var(--secondary-10)",
        color: "var(--secondary)",
      };
  }
};

const getStatusColor = (course: CourseCardData) => {
  if (course.archived) {
    return {
      backgroundColor: "var(--muted)",
      color: "var(--muted-foreground)",
    };
  }
  if (course.published) {
    return { backgroundColor: "var(--primary-10)", color: "var(--primary)" };
  }
  return { backgroundColor: "var(--accent-10)", color: "var(--accent)" };
};

const getStatusText = (course: CourseCardData) => {
  if (course.archived) return "Archived";
  if (course.published) return "Published";
  return "Draft";
};

export function CourseCard({
  course,
  actions = [],
  showImage = true,
  showStats = true,
  showProgress = false,
  showStatus = false,
  layout = "vertical",
  size = "md",
  className = "",
}: CourseCardProps) {
  // Default actions if none provided
  const defaultActions: CourseCardAction[] =
    actions.length > 0
      ? actions
      : [
          {
            label: course.enrolled ? "Continue Learning" : "Enroll Now",
            href: `/courses/${course.id}`,
            variant: "primary",
          },
          {
            label: "Preview",
            href: `/courses/${course.id}`,
            variant: "outline",
          },
        ];

  // Size classes
  const sizeClasses = {
    sm: {
      container: "rounded-lg",
      image: "h-32",
      padding: "p-4",
      title: "text-base",
      text: "",
    },
    md: {
      container: "rounded-xl",
      image: "h-48",
      padding: "p-6",
      title: "text-lg",
      text: "text-base",
    },
    lg: {
      container: "rounded-2xl",
      image: "h-56",
      padding: "p-8",
      title: "text-xl",
      text: "text-lg",
    },
  };

  const sizes = sizeClasses[size];

  const renderActionButton = (action: CourseCardAction, index: number) => {
    const baseClasses =
      "px-4 py-2 rounded-lg font-medium transition-all duration-200";

    const variantClasses = {
      primary: "text-primary-foreground",
      secondary: "text-secondary-foreground",
      outline: "border border-border hover:bg-muted",
      danger: "text-red-foreground",
    };

    const variantStyles = {
      primary: {
        backgroundColor: "var(--primary)",
        color: "var(--primary-foreground)",
      },
      secondary: {
        backgroundColor: "var(--secondary)",
        color: "var(--secondary-foreground)",
      },
      outline: {
        boxShadow:
          "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
        color: "var(--secondary)",
        backgroundColor: "transparent",
      },
      danger: {
        backgroundColor: "var(--destructive)",
        color: "var(--destructive-foreground)",
      },
    };

    const buttonClasses = `${baseClasses} ${variantClasses[action.variant]} ${
      action.disabled
        ? "opacity-50 cursor-not-allowed"
        : "hover:opacity-90 cursor-pointer"
    }`;

    if (action.href && !action.disabled) {
      return (
        <Link
          key={index}
          href={action.href}
          className={buttonClasses}
          style={variantStyles[action.variant]}
        >
          {action.label}
        </Link>
      );
    }

    return (
      <button
        key={index}
        onClick={action.onClick}
        disabled={action.disabled}
        className={buttonClasses}
        style={variantStyles[action.variant]}
      >
        {action.label}
      </button>
    );
  };

  if (layout === "horizontal") {
    return (
      <div
        className={`${sizes.container} transition-all duration-300 group overflow-hidden flex ${className}`}
        style={{
          backgroundColor: "var(--card)",
          boxShadow:
            "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow =
            "0 1px 2px rgba(38,70,83,0.06), 0 8px 32px rgba(38,70,83,0.12)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow =
            "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)";
        }}
      >
        {showImage && (
          <div className="shrink-0 w-48 relative">
            {course.heroImageUrl ? (
              <Image
                className="w-full h-full object-cover"
                src={course.heroImageUrl}
                alt={course.title}
                width={192}
                height={192}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  backgroundColor: "var(--muted)",
                  background:
                    "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
                }}
              >
                <i
                  className="fa-solid fa-graduation-cap text-4xl"
                  style={{ color: "var(--primary-foreground)" }}
                ></i>
              </div>
            )}

            {/* Overlays */}
            <div className="absolute top-3 left-3">
              <span
                className="px-2 py-1 rounded-full text-xs font-medium capitalize"
                style={getLevelColor(course.level)}
              >
                {course.level}
              </span>
            </div>

            {showStatus && (
              <div className="absolute top-3 right-3">
                <span
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={getStatusColor(course)}
                >
                  {getStatusText(course)}
                </span>
              </div>
            )}
          </div>
        )}

        <div className={`flex-1 ${sizes.padding}`}>
          <div className="flex flex-col h-full">
            <div className="flex-1">
              <h3
                className={`${sizes.title} font-semibold mb-2 group-hover:opacity-80 transition-all`}
                style={{ color: "var(--secondary)" }}
              >
                {course.title}
              </h3>

              <p
                className={`${sizes.text} mb-4 leading-relaxed line-clamp-2`}
                style={{ color: "var(--muted-foreground)" }}
              >
                {course.description}
              </p>

              {showStats && (
                <div
                  className="flex items-center  mb-4 space-x-4"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <div className="flex items-center">
                    <i className="fa-regular fa-clock mr-1"></i>
                    <span>{formatDuration(course.durationMinutes)}</span>
                  </div>
                  <div className="flex items-center">
                    <i className="fa-solid fa-play mr-1"></i>
                    <span>{course.moduleCount} modules</span>
                  </div>
                  {course.rating && (
                    <div className="flex items-center">
                      <i
                        className="fa-solid fa-star mr-1"
                        style={{ color: "var(--accent)" }}
                      ></i>
                      <span>
                        {course.rating}{" "}
                        {course.reviewCount && `(${course.reviewCount})`}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {showProgress && course.enrolled && (
                <div className="mb-4">
                  <div className="flex justify-between  mb-1">
                    <span style={{ color: "var(--muted-foreground)" }}>
                      Progress
                    </span>
                    <span style={{ color: "var(--secondary)" }}>
                      {course.progressPct || 0}%
                    </span>
                  </div>
                  <div
                    className="w-full rounded-full h-2"
                    style={{ backgroundColor: "var(--muted)" }}
                  >
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: "var(--primary)",
                        width: `${course.progressPct || 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-auto">
              {defaultActions.map((action, index) =>
                renderActionButton(action, index)
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vertical layout (default)
  return (
    <div
      className={`${sizes.container} transition-all duration-300 group overflow-hidden ${className}`}
      style={{
        backgroundColor: "var(--card)",
        boxShadow:
          "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow =
          "0 1px 2px rgba(38,70,83,0.06), 0 8px 32px rgba(38,70,83,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow =
          "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)";
      }}
    >
      {showImage && (
        <div className="relative">
          {course.heroImageUrl ? (
            <Image
              className={`w-full ${sizes.image} object-cover`}
              src={course.heroImageUrl}
              alt={course.title}
              width={400}
              height={192}
            />
          ) : (
            <div
              className={`w-full ${sizes.image} flex items-center justify-center`}
              style={{
                background:
                  "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
              }}
            >
              <i
                className="fa-solid fa-graduation-cap text-4xl"
                style={{ color: "var(--primary-foreground)" }}
              ></i>
            </div>
          )}

          {/* Category overlay */}
          {course.category && (
            <div className="absolute top-4 left-4">
              <span
                className="px-3 py-1 rounded-full  font-medium"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "var(--accent-foreground)",
                }}
              >
                {course.category}
              </span>
            </div>
          )}

          {/* Level overlay */}
          <div className="absolute top-4 right-4">
            <span
              className="px-3 py-1 rounded-full  font-medium capitalize"
              style={getLevelColor(course.level)}
            >
              {course.level}
            </span>
          </div>

          {/* Status overlay */}
          {showStatus && (
            <div className="absolute bottom-4 right-4">
              <span
                className="px-2 py-1 rounded-full text-xs font-medium"
                style={getStatusColor(course)}
              >
                {getStatusText(course)}
              </span>
            </div>
          )}
        </div>
      )}

      <div className={sizes.padding}>
        <h3
          className={`${sizes.title} font-semibold mb-2 group-hover:opacity-80 transition-all`}
          style={{ color: "var(--secondary)" }}
        >
          {course.title}
        </h3>

        <p
          className={`${sizes.text} mb-4 leading-relaxed line-clamp-3`}
          style={{ color: "var(--muted-foreground)" }}
        >
          {course.description}
        </p>

        {showStats && (
          <div
            className="flex items-center  mb-4 space-x-4"
            style={{ color: "var(--muted-foreground)" }}
          >
            <div className="flex items-center">
              <i className="fa-regular fa-clock mr-1"></i>
              <span>{formatDuration(course.durationMinutes)}</span>
            </div>
            <div className="flex items-center">
              <i className="fa-solid fa-play mr-1"></i>
              <span>{course.moduleCount} modules</span>
            </div>
            {course.rating && (
              <div className="flex items-center">
                <i
                  className="fa-solid fa-star mr-1"
                  style={{ color: "var(--accent)" }}
                ></i>
                <span>
                  {course.rating}{" "}
                  {course.reviewCount && `(${course.reviewCount})`}
                </span>
              </div>
            )}
          </div>
        )}

        {showProgress && course.enrolled && (
          <div className="mb-4">
            <div className="flex justify-between  mb-1">
              <span style={{ color: "var(--muted-foreground)" }}>Progress</span>
              <span style={{ color: "var(--secondary)" }}>
                {course.progressPct || 0}%
              </span>
            </div>
            <div
              className="w-full rounded-full h-2"
              style={{ backgroundColor: "var(--muted)" }}
            >
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: "var(--primary)",
                  width: `${course.progressPct || 0}%`,
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {defaultActions.map((action, index) =>
            renderActionButton(action, index)
          )}
        </div>
      </div>
    </div>
  );
}
