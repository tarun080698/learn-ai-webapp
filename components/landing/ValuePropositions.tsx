"use client";

export function ValuePropositions() {
  return (
    <section
      id="value-props"
      className="py-20"
      style={{ backgroundColor: "var(--muted)", opacity: 0.3 }}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2
            className="text-3xl lg:text-4xl font-bold mb-4"
            style={{ color: "var(--secondary)" }}
          >
            Why choose Learn.ai 4all?
          </h2>
          <p
            className="text-xl max-w-2xl mx-auto"
            style={{ color: "var(--muted-foreground)" }}
          >
            We provide everything you need to master new skills and advance your
            career
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div
            className="p-8 rounded-2xl transition-all duration-300 text-center group"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform"
              style={{
                backgroundColor: "var(--primary)",
              }}
            >
              <i
                className="fa-solid fa-graduation-cap text-2xl"
                style={{ color: "var(--primary-foreground)" }}
              ></i>
            </div>
            <h3
              className="text-xl font-semibold mb-4"
              style={{ color: "var(--secondary)" }}
            >
              Expert-Led Courses
            </h3>
            <p
              className="leading-relaxed"
              style={{ color: "var(--muted-foreground)" }}
            >
              Learn from industry experts with years of real-world experience in
              AI and machine learning
            </p>
          </div>

          <div
            className="p-8 rounded-2xl transition-all duration-300 text-center group"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform"
              style={{
                backgroundColor: "var(--accent)",
              }}
            >
              <i
                className="fa-solid fa-project-diagram text-2xl"
                style={{ color: "var(--accent-foreground)" }}
              ></i>
            </div>
            <h3
              className="text-xl font-semibold mb-4"
              style={{ color: "var(--secondary)" }}
            >
              Hands-On Projects
            </h3>
            <p
              className="leading-relaxed"
              style={{ color: "var(--muted-foreground)" }}
            >
              Build real-world projects and create a portfolio that showcases
              your AI development skills
            </p>
          </div>

          <div
            className="p-8 rounded-2xl transition-all duration-300 text-center group"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform"
              style={{
                backgroundColor: "var(--secondary)",
              }}
            >
              <i
                className="fa-solid fa-chart-line text-2xl"
                style={{ color: "var(--secondary-foreground)" }}
              ></i>
            </div>
            <h3
              className="text-xl font-semibold mb-4"
              style={{ color: "var(--secondary)" }}
            >
              Progress Tracking
            </h3>
            <p
              className="leading-relaxed"
              style={{ color: "var(--muted-foreground)" }}
            >
              Monitor your learning journey with detailed analytics and
              personalized recommendations
            </p>
          </div>

          <div
            className="p-8 rounded-2xl transition-all duration-300 text-center group"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform"
              style={{
                backgroundColor: "var(--destructive)",
              }}
            >
              <i
                className="fa-solid fa-certificate text-2xl"
                style={{ color: "var(--destructive-foreground)" }}
              ></i>
            </div>
            <h3
              className="text-xl font-semibold mb-4"
              style={{ color: "var(--secondary)" }}
            >
              Certification
            </h3>
            <p
              className="leading-relaxed"
              style={{ color: "var(--muted-foreground)" }}
            >
              Earn industry-recognized certificates upon course completion to
              boost your career
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
