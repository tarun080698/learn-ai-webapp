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
      return "bg-green-100 text-green-800";
    case "intermediate":
      return "bg-yellow-100 text-yellow-800";
    case "advanced":
      return "bg-red-100 text-red-800";
    default:
      return "bg-blue-100 text-blue-800";
  }
};

const getStatusColor = (course: CourseCardData) => {
  if (course.archived) {
    return "bg-gray-100 text-gray-800";
  }
  if (course.published) {
    return "bg-green-100 text-green-800";
  }
  return "bg-yellow-100 text-yellow-800";
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
      text: "text-sm",
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
        border: "1px solid var(--border)",
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
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-lg)",
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
                className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getLevelColor(
                  course.level
                )}`}
              >
                {course.level}
              </span>
            </div>

            {showStatus && (
              <div className="absolute top-3 right-3">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    course
                  )}`}
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
                  className="flex items-center text-sm mb-4 space-x-4"
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
                  <div className="flex justify-between text-sm mb-1">
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
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-lg)",
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
                className="px-3 py-1 rounded-full text-sm font-medium"
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
              className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getLevelColor(
                course.level
              )}`}
            >
              {course.level}
            </span>
          </div>

          {/* Status overlay */}
          {showStatus && (
            <div className="absolute bottom-4 right-4">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  course
                )}`}
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
            className="flex items-center text-sm mb-4 space-x-4"
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
            <div className="flex justify-between text-sm mb-1">
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
