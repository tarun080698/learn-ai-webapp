"use client";

export function SystemStatus() {
  const statusItems = [
    {
      title: "API Services",
      status: "Operational",
      statusColor: "var(--primary)",
      dotColor: "var(--primary)",
      metrics: [
        { label: "Response Time", value: "124ms" },
        { label: "Uptime", value: "99.9%" },
      ],
    },
    {
      title: "Database",
      status: "Operational",
      statusColor: "var(--primary)",
      dotColor: "var(--primary)",
      metrics: [
        { label: "Query Time", value: "45ms" },
        { label: "Connections", value: "847/1000" },
      ],
    },
    {
      title: "CDN",
      status: "Operational",
      statusColor: "var(--primary)",
      dotColor: "var(--primary)",
      metrics: [
        { label: "Load Time", value: "89ms" },
        { label: "Cache Hit", value: "94.2%" },
      ],
    },
  ];

  return (
    <section className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2
            className="text-3xl font-bold mb-4"
            style={{ color: "var(--secondary)" }}
          >
            System Status
          </h2>
          <p className="text-lg" style={{ color: "var(--secondary-70)" }}>
            All systems operational and running smoothly
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statusItems.map((item, index) => (
            <div
              key={index}
              className="rounded-2xl p-6"
              style={{
                backgroundColor: "var(--card)",
                boxShadow: "0 4px 20px rgba(38,70,83,0.08)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="font-semibold"
                  style={{ color: "var(--secondary)" }}
                >
                  {item.title}
                </h3>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: item.dotColor }}
                  ></div>
                  <span
                    className="text-sm font-medium"
                    style={{ color: item.statusColor }}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
              <div
                className="space-y-2 text-sm"
                style={{ color: "var(--secondary-70)" }}
              >
                {item.metrics.map((metric, metricIndex) => (
                  <div key={metricIndex} className="flex justify-between">
                    <span>{metric.label}</span>
                    <span>{metric.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
