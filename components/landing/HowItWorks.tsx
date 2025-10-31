"use client";

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-20"
      style={{ backgroundColor: "var(--muted)" }}
    >
      <div className="container mx-auto px-4">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ color: "var(--secondary)" }}
            >
              How it works
            </h2>
            <p
              className="text-xl max-w-2xl mx-auto"
              style={{ color: "var(--muted-foreground)" }}
            >
              Start learning in three simple steps and track your progress along
              the way
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            <div className="text-center group">
              <div className="relative mb-8">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: "var(--primary)" }}
                >
                  <i
                    className="fa-solid fa-search text-2xl"
                    style={{ color: "var(--primary-foreground)" }}
                  ></i>
                </div>
                <div
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  <span
                    className="font-bold "
                    style={{ color: "var(--accent-foreground)" }}
                  >
                    1
                  </span>
                </div>
              </div>
              <h3
                className="text-xl font-semibold mb-4"
                style={{ color: "var(--secondary)" }}
              >
                Browse a Course
              </h3>
              <p
                className="leading-relaxed"
                style={{ color: "var(--muted-foreground)" }}
              >
                Explore our comprehensive catalog of AI courses across various
                domains. Find the perfect course that matches your learning
                goals and skill level.
              </p>
            </div>

            <div className="text-center group">
              <div className="relative mb-8">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  <i
                    className="fa-solid fa-clipboard-check text-2xl"
                    style={{ color: "var(--accent-foreground)" }}
                  ></i>
                </div>
                <div
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--secondary)" }}
                >
                  <span
                    className="font-bold "
                    style={{ color: "var(--secondary-foreground)" }}
                  >
                    2
                  </span>
                </div>
              </div>
              <h3
                className="text-xl font-semibold mb-4"
                style={{ color: "var(--secondary)" }}
              >
                Enroll & Take Pre-Assessment
              </h3>
              <p
                className="leading-relaxed"
                style={{ color: "var(--muted-foreground)" }}
              >
                Enroll in your chosen course and complete a pre-assessment to
                gauge your current knowledge. This helps us personalize your
                learning experience.
              </p>
            </div>

            <div className="text-center group">
              <div className="relative mb-8">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: "var(--secondary)" }}
                >
                  <i
                    className="fa-solid fa-chart-line text-2xl"
                    style={{ color: "var(--secondary-foreground)" }}
                  ></i>
                </div>
                <div
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--primary)" }}
                >
                  <span
                    className="font-bold "
                    style={{ color: "var(--primary-foreground)" }}
                  >
                    3
                  </span>
                </div>
              </div>
              <h3
                className="text-xl font-semibold mb-4"
                style={{ color: "var(--secondary)" }}
              >
                Learn & Track Progress
              </h3>
              <p
                className="leading-relaxed"
                style={{ color: "var(--muted-foreground)" }}
              >
                Work through modules at your own pace, complete hands-on
                projects, and track your progress with detailed analytics and
                milestone achievements.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
