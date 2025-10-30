"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBook,
  faUsers,
  faTrophy,
  faStar,
} from "@fortawesome/free-solid-svg-icons";

export function PlatformStats() {
  const stats = [
    {
      icon: faBook,
      value: "247",
      label: "Total Courses",
      bgColor: "var(--primary-10)",
      iconColor: "var(--primary)",
    },
    {
      icon: faUsers,
      value: "15,847",
      label: "Active Learners",
      bgColor: "var(--accent-10)",
      iconColor: "var(--accent)",
    },
    {
      icon: faTrophy,
      value: "8,923",
      label: "Completions",
      bgColor: "var(--destructive-10)",
      iconColor: "var(--destructive)",
    },
    {
      icon: faStar,
      value: "4.8",
      label: "Average Rating",
      bgColor: "var(--secondary-10)",
      iconColor: "var(--secondary)",
    },
  ];

  return (
    <section className="py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2
            className="text-3xl font-bold mb-4"
            style={{ color: "var(--secondary)" }}
          >
            Platform Overview
          </h2>
          <p className="text-lg" style={{ color: "var(--secondary-70)" }}>
            Real-time statistics from your Learn AI platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="rounded-2xl p-6 text-center"
              style={{
                backgroundColor: "var(--card)",
                boxShadow: "0 4px 20px rgba(38,70,83,0.08)",
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: stat.bgColor }}
              >
                <FontAwesomeIcon
                  icon={stat.icon}
                  className="text-xl"
                  style={{ color: stat.iconColor }}
                />
              </div>
              <div
                className="text-3xl font-bold mb-2"
                style={{ color: "var(--secondary)" }}
              >
                {stat.value}
              </div>
              <p className="text-sm" style={{ color: "var(--secondary-70)" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
