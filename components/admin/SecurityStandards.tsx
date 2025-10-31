"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShield, faKey, faHistory } from "@fortawesome/free-solid-svg-icons";

export function SecurityStandards() {
  const securityFeatures = [
    {
      icon: faShield,
      title: "256-bit SSL Encryption",
      description:
        "All data transmission is encrypted using military-grade security protocols",
      bgColor: "var(--primary-10)",
      iconColor: "var(--primary)",
    },
    {
      icon: faKey,
      title: "Multi-Factor Authentication",
      description:
        "Additional security layers to protect administrator accounts from unauthorized access",
      bgColor: "var(--accent-10)",
      iconColor: "var(--accent)",
    },
    {
      icon: faHistory,
      title: "Activity Monitoring",
      description:
        "Comprehensive audit trails and real-time monitoring of all administrative actions",
      bgColor: "var(--destructive-10)",
      iconColor: "var(--destructive)",
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
            Enterprise-Grade Security
          </h2>
          <p className="text-lg" style={{ color: "var(--secondary-70)" }}>
            Your data is protected with industry-leading security measures
          </p>
        </div>

        <div className="hidden grid grid-cols-1 md:grid-cols-3 gap-8">
          {securityFeatures.map((feature, index) => (
            <div key={index} className="text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: feature.bgColor }}
              >
                <FontAwesomeIcon
                  icon={feature.icon}
                  className="text-2xl"
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
