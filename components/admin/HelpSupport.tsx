"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBook,
  faVideo,
  faHeadset,
  faArrowRight,
  faPlay,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";

export function HelpSupport() {
  const helpItems = [
    {
      icon: faBook,
      iconBg: "var(--primary-10)",
      iconColor: "var(--primary)",
      title: "Documentation",
      description:
        "Comprehensive guides and API references for platform administration",
      linkText: "View Docs",
      linkIcon: faArrowRight,
      linkColor: "var(--primary)",
      linkColorHover: "var(--primary-80)",
    },
    {
      icon: faVideo,
      iconBg: "var(--accent-10)",
      iconColor: "var(--accent)",
      title: "Video Tutorials",
      description: "Step-by-step video guides for common administrative tasks",
      linkText: "Watch Videos",
      linkIcon: faPlay,
      linkColor: "var(--accent)",
      linkColorHover: "var(--accent-80)",
    },
    {
      icon: faHeadset,
      iconBg: "var(--destructive-10)",
      iconColor: "var(--destructive)",
      title: "24/7 Support",
      description: "Get immediate help from our dedicated support team",
      linkText: "Contact Support",
      linkIcon: faPhone,
      linkColor: "var(--destructive)",
      linkColorHover: "var(--destructive-80)",
    },
  ];

  return (
    <section className="py-16 px-6 bg-secondary/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2
            className="text-3xl font-bold mb-4"
            style={{ color: "var(--secondary)" }}
          >
            Need Help?
          </h2>
          <p className="text-lg" style={{ color: "var(--secondary-70)" }}>
            Access resources and support for administrators
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {helpItems.map((item, index) => (
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
                style={{ backgroundColor: item.iconBg }}
              >
                <FontAwesomeIcon
                  icon={item.icon}
                  className="text-xl"
                  style={{ color: item.iconColor }}
                />
              </div>
              <h3
                className="font-semibold mb-2"
                style={{ color: "var(--secondary)" }}
              >
                {item.title}
              </h3>
              <p className=" mb-4" style={{ color: "var(--secondary-70)" }}>
                {item.description}
              </p>
              <button
                className="font-medium  flex items-center space-x-1 transition-colors duration-200"
                style={{ color: item.linkColor }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = item.linkColorHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = item.linkColor;
                }}
              >
                <span>{item.linkText}</span>
                <FontAwesomeIcon icon={item.linkIcon} className="text-xs" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
