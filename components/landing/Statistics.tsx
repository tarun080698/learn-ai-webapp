"use client";

export function Statistics() {
  return (
    <section
      id="statistics"
      className="py-20"
      style={{
        background: "linear-gradient(135deg, var(--primary), var(--secondary))",
      }}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2
            className="text-3xl lg:text-4xl font-bold mb-4"
            style={{ color: "var(--primary-foreground)" }}
          >
            Trusted by learners worldwide
          </h2>
          <p
            className="text-xl max-w-2xl mx-auto"
            style={{
              color: "var(--primary-foreground)",
              opacity: 0.8,
            }}
          >
            Join a global community of learners and transform your career with
            industry-relevant AI skills
          </p>
        </div>
        <div className="hidden md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div
              className="text-5xl font-bold mb-2"
              style={{ color: "var(--primary-foreground)" }}
            >
              50K+
            </div>
            <div
              className="text-lg"
              style={{
                color: "var(--primary-foreground)",
                opacity: 0.8,
              }}
            >
              Active Students
            </div>
            <div
              className="text-sm mt-2"
              style={{
                color: "var(--primary-foreground)",
                opacity: 0.6,
              }}
            >
              Learning every day
            </div>
          </div>
          <div className="text-center">
            <div
              className="text-5xl font-bold mb-2"
              style={{ color: "var(--primary-foreground)" }}
            >
              200+
            </div>
            <div
              className="text-lg"
              style={{
                color: "var(--primary-foreground)",
                opacity: 0.8,
              }}
            >
              Expert Courses
            </div>
            <div
              className="text-sm mt-2"
              style={{
                color: "var(--primary-foreground)",
                opacity: 0.6,
              }}
            >
              Across AI domains
            </div>
          </div>
          <div className="text-center">
            <div
              className="text-5xl font-bold mb-2"
              style={{ color: "var(--primary-foreground)" }}
            >
              95%
            </div>
            <div
              className="text-lg"
              style={{
                color: "var(--primary-foreground)",
                opacity: 0.8,
              }}
            >
              Completion Rate
            </div>
            <div
              className="text-sm mt-2"
              style={{
                color: "var(--primary-foreground)",
                opacity: 0.6,
              }}
            >
              Students finish courses
            </div>
          </div>
          <div className="text-center">
            <div
              className="text-5xl font-bold mb-2"
              style={{ color: "var(--primary-foreground)" }}
            >
              4.9
            </div>
            <div
              className="flex items-center justify-center text-lg"
              style={{
                color: "var(--primary-foreground)",
                opacity: 0.8,
              }}
            >
              Average Rating
              <i
                className="fa-solid fa-star ml-2"
                style={{ color: "var(--accent)" }}
              ></i>
            </div>
            <div
              className="text-sm mt-2"
              style={{
                color: "var(--primary-foreground)",
                opacity: 0.6,
              }}
            >
              From 25K+ reviews
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
