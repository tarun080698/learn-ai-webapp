"use client";

import Link from "next/link";

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative py-20 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, var(--background) 0%, var(--muted) 30%, var(--background) 100%)",
      }}
    >
      <div className="absolute inset-0 opacity-5"></div>
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <div
                className="inline-flex items-center px-4 py-2 rounded-full  font-medium"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-foreground)",
                }}
              >
                <i className="fa-solid fa-sparkles mr-2"></i>
                New courses added weekly
              </div>
              <h1
                className="text-5xl lg:text-6xl font-bold leading-tight"
                style={{ color: "var(--secondary)" }}
              >
                Master AI with
                <span style={{ color: "var(--primary)" }}>
                  {" "}
                  Interactive Learning
                </span>
              </h1>
              <p
                className="text-xl leading-relaxed max-w-lg"
                style={{ color: "var(--muted-foreground)" }}
              >
                Comprehensive courses, hands-on projects, and personalized
                progress tracking. Learn artificial intelligence at your own
                pace with expert guidance.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/catalog"
                className="px-8 py-4 rounded-lg transition-all duration-200 font-semibold text-center flex items-center justify-center"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-foreground)",
                  boxShadow: "var(--shadow-lg)",
                }}
              >
                <i className="fa-solid fa-rocket mr-2"></i>
                Browse Courses
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 rounded-lg transition-all duration-200 font-semibold text-center"
                style={{
                  boxShadow:
                    "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
                  backgroundColor: "var(--card)",
                  color: "var(--secondary)",
                }}
              >
                <i className="fa-solid fa-user mr-2"></i>
                Get Started
              </Link>
            </div>
            <div className="hidden items-center space-x-8 pt-4">
              <div className="text-center">
                <div
                  className="text-2xl font-bold"
                  style={{ color: "var(--secondary)" }}
                >
                  50K+
                </div>
                <div className="" style={{ color: "var(--muted-foreground)" }}>
                  Students
                </div>
              </div>
              <div className="text-center">
                <div
                  className="text-2xl font-bold"
                  style={{ color: "var(--secondary)" }}
                >
                  200+
                </div>
                <div className="" style={{ color: "var(--muted-foreground)" }}>
                  Courses
                </div>
              </div>
              <div className="text-center">
                <div
                  className="text-2xl font-bold"
                  style={{ color: "var(--secondary)" }}
                >
                  4.9
                </div>
                <div
                  className=" flex items-center"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <i
                    className="fa-solid fa-star mr-1"
                    style={{ color: "var(--accent)" }}
                  ></i>
                  Rating
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="relative z-10">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div
                    className="p-6 rounded-2xl hover:shadow-xl transition-all duration-300 animate-float"
                    style={{
                      backgroundColor: "var(--card)",
                      boxShadow:
                        "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                      style={{
                        backgroundColor: "var(--primary-10)",
                      }}
                    >
                      <i
                        className="fa-solid fa-robot text-xl"
                        style={{ color: "var(--primary)" }}
                      ></i>
                    </div>
                    <h3
                      className="font-semibold mb-2"
                      style={{ color: "var(--secondary)" }}
                    >
                      Machine Learning
                    </h3>
                    <p
                      className=""
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Build predictive models
                    </p>
                    <div
                      className="mt-4 rounded-full h-2"
                      style={{ backgroundColor: "var(--muted)" }}
                    >
                      <div
                        className="h-2 rounded-full w-4/5"
                        style={{ backgroundColor: "var(--primary)" }}
                      ></div>
                    </div>
                  </div>

                  <div
                    className="p-5 rounded-2xl hover:shadow-xl transition-all duration-300 animate-float"
                    style={{
                      backgroundColor: "var(--card)",
                      boxShadow:
                        "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",

                      animationDelay: "1s",
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                      style={{
                        backgroundColor: "var(--accent-10)",
                      }}
                    >
                      <i
                        className="fa-solid fa-brain text-lg"
                        style={{ color: "var(--accent)" }}
                      ></i>
                    </div>
                    <h3
                      className="font-semibold mb-1 "
                      style={{ color: "var(--secondary)" }}
                    >
                      Neural Networks
                    </h3>
                    <p
                      className="text-xs"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Deep learning fundamentals
                    </p>
                    <div
                      className="mt-3 rounded-full h-1.5"
                      style={{ backgroundColor: "var(--muted)" }}
                    >
                      <div
                        className="h-1.5 rounded-full w-3/5"
                        style={{ backgroundColor: "var(--accent)" }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mt-8">
                  <div
                    className="p-5 rounded-2xl hover:shadow-xl transition-all duration-300 animate-float"
                    style={{
                      backgroundColor: "var(--card)",
                      boxShadow:
                        "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",

                      animationDelay: "0.5s",
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                      style={{
                        backgroundColor: "var(--secondary-10)",
                      }}
                    >
                      <i
                        className="fa-solid fa-chart-line text-lg"
                        style={{ color: "var(--secondary)" }}
                      ></i>
                    </div>
                    <h3
                      className="font-semibold mb-1 "
                      style={{ color: "var(--secondary)" }}
                    >
                      Data Science
                    </h3>
                    <p
                      className="text-xs"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Analytics & insights
                    </p>
                    <div
                      className="mt-3 rounded-full h-1.5"
                      style={{ backgroundColor: "var(--muted)" }}
                    >
                      <div
                        className="h-1.5 rounded-full w-2/3"
                        style={{ backgroundColor: "var(--secondary)" }}
                      ></div>
                    </div>
                  </div>

                  <div
                    className="p-6 rounded-2xl hover:shadow-xl transition-all duration-300 animate-float"
                    style={{
                      backgroundColor: "var(--card)",
                      boxShadow:
                        "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
                      boxShadow: "var(--shadow-lg)",
                      animationDelay: "1.5s",
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                      style={{
                        backgroundColor: "var(--destructive-10)",
                      }}
                    >
                      <i
                        className="fa-solid fa-eye text-xl"
                        style={{ color: "var(--destructive)" }}
                      ></i>
                    </div>
                    <h3
                      className="font-semibold mb-2"
                      style={{ color: "var(--secondary)" }}
                    >
                      Computer Vision
                    </h3>
                    <p
                      className=""
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Image recognition & analysis
                    </p>
                    <div
                      className="mt-4 rounded-full h-2"
                      style={{ backgroundColor: "var(--muted)" }}
                    >
                      <div
                        className="h-2 rounded-full w-1/2"
                        style={{ backgroundColor: "var(--destructive)" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div
              className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl"
              style={{
                backgroundColor: "var(--primary-10)",
              }}
            ></div>
            <div
              className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full blur-2xl"
              style={{
                backgroundColor: "var(--accent-10)",
              }}
            ></div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </section>
  );
}
