"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine,
  faGraduationCap,
  faUsers,
  faCogs,
} from "@fortawesome/free-solid-svg-icons";

export function FeaturesOverview() {
  const features = [
    {
      icon: faChartLine,
      title: "Advanced Analytics",
      description:
        "Track student progress, course performance, and engagement metrics in real-time",
      bgColor: "var(--primary-10)",
      iconColor: "var(--primary)",
    },
    {
      icon: faGraduationCap,
      title: "Course Management",
      description:
        "Create, edit, and organize courses with our intuitive drag-and-drop interface",
      bgColor: "var(--accent-10)",
      iconColor: "var(--accent)",
    },
    {
      icon: faUsers,
      title: "Student Management",
      description:
        "Manage enrollments, track progress, and communicate with learners effectively",
      bgColor: "var(--destructive-10)",
      iconColor: "var(--destructive)",
    },
    {
      icon: faCogs,
      title: "System Configuration",
      description:
        "Customize platform settings, integrations, and user permissions with ease",
      bgColor: "var(--secondary-10)",
      iconColor: "var(--secondary)",
    },
  ];

  return (
    <section className="py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2
            className="text-3xl font-bold mb-4"
            style={{ color: "var(--secondary)" }}
          >
            Powerful Admin Features
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ color: "var(--secondary-70)" }}
          >
            Comprehensive tools to manage your learning platform efficiently
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="rounded-2xl p-6 transition-all duration-300"
              style={{
                backgroundColor: "var(--card)",
                boxShadow: "0 4px 20px rgba(38,70,83,0.08)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 8px 30px rgba(38,70,83,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 4px 20px rgba(38,70,83,0.08)";
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: feature.bgColor }}
              >
                <FontAwesomeIcon
                  icon={feature.icon}
                  className="text-xl"
                  style={{ color: feature.iconColor }}
                />
              </div>
              <h3
                className="font-semibold mb-2"
                style={{ color: "var(--secondary)" }}
              >
                {feature.title}
              </h3>
              <p className="" style={{ color: "var(--secondary-70)" }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
