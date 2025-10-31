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
        <div className="text-center">
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
      </div>
    </section>
  );
}
