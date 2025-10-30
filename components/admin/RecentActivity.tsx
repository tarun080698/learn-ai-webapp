"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEdit,
  faUserPlus,
  faArchive,
  faUsers,
  faStar,
  faBookOpen,
} from "@fortawesome/free-solid-svg-icons";

export function RecentActivity() {
  const activities = [
    {
      icon: faPlus,
      iconBg: "var(--primary-10)",
      iconColor: "var(--primary)",
      title: 'New course "Advanced React Patterns" published',
      subtitle: "Course created by Admin Team • 2 hours ago",
      stats: [
        { icon: faUsers, label: "0 enrollments" },
        { icon: faBookOpen, label: "12 modules" },
      ],
    },
    {
      icon: faEdit,
      iconBg: "var(--accent-10)",
      iconColor: "var(--accent)",
      title: 'Course "JavaScript Fundamentals" updated',
      subtitle: "Content revised and new quiz added • 5 hours ago",
      stats: [
        { icon: faUsers, label: "1,247 enrollments" },
        { icon: faStar, label: "4.9 rating" },
      ],
    },
    {
      icon: faUserPlus,
      iconBg: "var(--primary-10)",
      iconColor: "var(--primary)",
      title: "124 new student enrollments today",
      subtitle: "Across 23 different courses • 8 hours ago",
      stats: [
        { icon: faUsers, label: "+15% vs yesterday" },
        { icon: faUsers, label: "Peak: 2-4 PM" },
      ],
    },
    {
      icon: faArchive,
      iconBg: "var(--destructive-10)",
      iconColor: "var(--destructive)",
      title: 'Course "Python Basics" archived',
      subtitle: "Course moved to archive due to outdated content • 1 day ago",
      stats: [
        { icon: faUsers, label: "856 completed" },
        { icon: faUsers, label: "92% completion rate" },
      ],
    },
  ];

  return (
    <section className="py-16 px-6 bg-secondary/5">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2
            className="text-3xl font-bold mb-4"
            style={{ color: "var(--secondary)" }}
          >
            Recent Platform Activity
          </h2>
          <p className="text-lg" style={{ color: "var(--secondary-70)" }}>
            Stay updated with the latest happenings on your platform
          </p>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: "var(--card)",
            boxShadow: "0 8px 32px rgba(38,70,83,0.08)",
          }}
        >
          <div className="space-y-6">
            {activities.map((activity, index) => (
              <div
                key={index}
                className={`flex items-start space-x-4 ${
                  index !== activities.length - 1
                    ? "pb-6 border-b border-secondary/10"
                    : ""
                }`}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: activity.iconBg }}
                >
                  <FontAwesomeIcon
                    icon={activity.icon}
                    style={{ color: activity.iconColor }}
                  />
                </div>
                <div className="flex-1">
                  <p
                    className="font-medium"
                    style={{ color: "var(--secondary)" }}
                  >
                    {activity.title}
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "var(--secondary-70)" }}
                  >
                    {activity.subtitle}
                  </p>
                  <div
                    className="mt-2 flex items-center space-x-4 text-xs"
                    style={{ color: "var(--secondary-60)" }}
                  >
                    {activity.stats.map((stat, statIndex) => (
                      <span
                        key={statIndex}
                        className="flex items-center space-x-1"
                      >
                        <FontAwesomeIcon
                          icon={stat.icon}
                          style={{ color: "inherit" }}
                        />
                        <span>{stat.label}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
