"use client";

import { useAuth } from "@/app/(auth)/AuthProvider";
import { RouteGuard } from "@/app/components/RouteGuard";
import { PublicLayout } from "@/components/PublicLayout";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginContent() {
  const { signInWithGoogle, firebaseUser } = useAuth();
  const [signing, setSigning] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const redirectUrl = searchParams.get("redirect");

  // Redirect authenticated users
  useEffect(() => {
    if (firebaseUser) {
      const redirectTo = redirectUrl || returnUrl || "/dashboard";
      router.push(redirectTo);
    }
  }, [firebaseUser, router, returnUrl, redirectUrl]);

  const handleGoogleSignIn = async () => {
    try {
      setSigning(true);
      await signInWithGoogle();
      // Will be redirected by useEffect above when firebaseUser is set
    } catch (error) {
      console.error("Google sign in error:", error);
      setSigning(false);
    }
  };

  return (
    <RouteGuard>
      <PublicLayout showPromoBanner={false}>
        {/* Login Hero Section */}
        <section
          className="min-h-[600px] relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, var(--background) 0%, var(--muted) 30%, var(--background) 100%)",
          }}
        >
          <div className="absolute inset-0 opacity-5"></div>
          <div className="container mx-auto px-4 py-20">
            <div className="max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                {/* Left Side - Welcome Content */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div
                      className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: "var(--primary)",
                        color: "var(--primary-foreground)",
                      }}
                    >
                      <i className="fa-solid fa-lock mr-2"></i>
                      Secure Login
                    </div>
                    <h1
                      className="text-4xl lg:text-5xl font-bold leading-tight"
                      style={{ color: "var(--secondary)" }}
                    >
                      Welcome back to{" "}
                      <span style={{ color: "var(--primary)" }}>Learn.ai</span>
                    </h1>
                    <p
                      className="text-xl leading-relaxed"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Continue your learning journey and unlock your potential
                      with our expert-led AI courses and hands-on projects.
                    </p>
                  </div>

                  {/* Trust Indicators */}
                  <div className="hidden grid grid-cols-3 gap-6">
                    <div className="text-center">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2"
                        style={{
                          backgroundColor: "var(--primary-10)",
                        }}
                      >
                        <i
                          className="fa-solid fa-shield-alt"
                          style={{ color: "var(--primary)" }}
                        ></i>
                      </div>
                      <div
                        className="text-sm font-medium"
                        style={{ color: "var(--secondary)" }}
                      >
                        Secure
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        256-bit SSL
                      </div>
                    </div>
                    <div className="text-center">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2"
                        style={{
                          backgroundColor: "var(--accent-10)",
                        }}
                      >
                        <i
                          className="fa-solid fa-users"
                          style={{ color: "var(--accent)" }}
                        ></i>
                      </div>
                      <div
                        className="text-sm font-medium"
                        style={{ color: "var(--secondary)" }}
                      >
                        Trusted
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        10K+ Users
                      </div>
                    </div>
                    <div className="text-center">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2"
                        style={{
                          backgroundColor: "var(--secondary-10)",
                        }}
                      >
                        <i
                          className="fa-solid fa-clock"
                          style={{ color: "var(--secondary)" }}
                        ></i>
                      </div>
                      <div
                        className="text-sm font-medium"
                        style={{ color: "var(--secondary)" }}
                      >
                        24/7
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        Support
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity Preview */}
                  <div
                    className="p-6 rounded-2xl backdrop-blur-sm"
                    style={{
                      backgroundColor: "var(--card)",
                      opacity: 0.5,
                      border: "1px solid var(--border)",
                    }}
                  >
                    <h3
                      className="font-semibold mb-4"
                      style={{ color: "var(--secondary)" }}
                    >
                      Continue Learning
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: "var(--primary-10)",
                          }}
                        >
                          <i
                            className="fa-solid fa-robot text-sm"
                            style={{ color: "var(--primary)" }}
                          ></i>
                        </div>
                        <div className="flex-1">
                          <div
                            className="text-sm font-medium"
                            style={{ color: "var(--secondary)" }}
                          >
                            AI Fundamentals
                          </div>
                          <div
                            className="text-xs"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            Progress: 65%
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: "var(--accent-10)",
                          }}
                        >
                          <i
                            className="fa-solid fa-brain text-sm"
                            style={{ color: "var(--accent)" }}
                          ></i>
                        </div>
                        <div className="flex-1">
                          <div
                            className="text-sm font-medium"
                            style={{ color: "var(--secondary)" }}
                          >
                            Machine Learning
                          </div>
                          <div
                            className="text-xs"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            Progress: 32%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="relative">
                  <div
                    className="p-8 lg:p-12 rounded-3xl relative z-10 backdrop-blur-md"
                    style={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      boxShadow: "var(--shadow-lg)",
                    }}
                  >
                    <div className="text-center mb-8">
                      <h2
                        className="text-2xl font-bold mb-2"
                        style={{ color: "var(--secondary)" }}
                      >
                        Sign in to your account
                      </h2>
                    </div>

                    <div className="space-y-6">
                      <button
                        onClick={handleGoogleSignIn}
                        disabled={signing}
                        type="button"
                        className="w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                        style={{
                          backgroundColor: "var(--primary)",
                          color: "var(--primary-foreground)",
                        }}
                      >
                        {signing ? (
                          <>
                            <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                            <span>Signing In...</span>
                          </>
                        ) : (
                          <>
                            <i className="fa-brands fa-google mr-2"></i>
                            Sign in with Google
                          </>
                        )}
                      </button>

                      <div
                        className="text-center text-sm"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        <i className="fa-solid fa-magic-wand-sparkles mr-1"></i>
                        Secure authentication with Google OAuth
                      </div>
                    </div>
                  </div>

                  {/* Floating Elements */}
                  <div
                    className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl animate-pulse"
                    style={{ backgroundColor: "var(--primary-10)" }}
                  ></div>
                  <div
                    className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full blur-2xl animate-pulse"
                    style={{
                      backgroundColor: "var(--accent-10)",
                      animationDelay: "1s",
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section className="hidden py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div
                className="p-12 rounded-3xl text-center"
                style={{
                  background: `linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)`,
                }}
              >
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                >
                  <i
                    className="fa-solid fa-headset text-3xl"
                    style={{ color: "var(--primary-foreground)" }}
                  ></i>
                </div>
                <h2
                  className="text-3xl lg:text-4xl font-bold mb-4"
                  style={{ color: "var(--primary-foreground)" }}
                >
                  Need help signing in?
                </h2>
                <p
                  className="text-xl mb-8 max-w-2xl mx-auto"
                  style={{ color: "var(--primary-foreground)", opacity: 0.8 }}
                >
                  Our support team is here to help you with any login issues or
                  account questions
                </p>
                <div className="grid md:grid-cols-3 gap-6">
                  <a
                    href="/help"
                    className="p-6 rounded-2xl transition-colors group backdrop-blur-sm"
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                  >
                    <i
                      className="fa-solid fa-book text-2xl mb-3"
                      style={{ color: "var(--primary-foreground)" }}
                    ></i>
                    <h3
                      className="text-lg font-semibold mb-2"
                      style={{ color: "var(--primary-foreground)" }}
                    >
                      Help Center
                    </h3>
                    <p
                      className="text-sm"
                      style={{
                        color: "var(--primary-foreground)",
                        opacity: 0.8,
                      }}
                    >
                      Browse our comprehensive help articles and tutorials
                    </p>
                  </a>
                  <a
                    href="/contact"
                    className="p-6 rounded-2xl transition-colors group backdrop-blur-sm"
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                  >
                    <i
                      className="fa-solid fa-comments text-2xl mb-3"
                      style={{ color: "var(--primary-foreground)" }}
                    ></i>
                    <h3
                      className="text-lg font-semibold mb-2"
                      style={{ color: "var(--primary-foreground)" }}
                    >
                      Live Chat
                    </h3>
                    <p
                      className="text-sm"
                      style={{
                        color: "var(--primary-foreground)",
                        opacity: 0.8,
                      }}
                    >
                      Get instant help from our support team
                    </p>
                  </a>
                  <a
                    href="mailto:support@learnai.com"
                    className="p-6 rounded-2xl transition-colors group backdrop-blur-sm"
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                  >
                    <i
                      className="fa-solid fa-envelope text-2xl mb-3"
                      style={{ color: "var(--primary-foreground)" }}
                    ></i>
                    <h3
                      className="text-lg font-semibold mb-2"
                      style={{ color: "var(--primary-foreground)" }}
                    >
                      Email Support
                    </h3>
                    <p
                      className="text-sm"
                      style={{
                        color: "var(--primary-foreground)",
                        opacity: 0.8,
                      }}
                    >
                      Send us a message and we&apos;ll respond within 24 hours
                    </p>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </PublicLayout>
    </RouteGuard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
