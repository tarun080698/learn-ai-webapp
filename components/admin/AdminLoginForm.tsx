"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserShield,
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  faArrowRight,
  faSpinner,
  faExclamationTriangle,
  faClock,
  faInfoCircle,
  faShield,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/app/(auth)/AuthProvider";

export function AdminLoginForm() {
  const { signInAdminWithEmailPassword } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSigning(true);

    try {
      await signInAdminWithEmailPassword(formData.email, formData.password);
      // AuthProvider will handle mark-login and role validation
    } catch (error: unknown) {
      console.error("Admin sign in error:", error);
      const message =
        error instanceof Error ? error.message : "Invalid email or password";
      setError(message);
      setSigning(false);
    }
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <main className="flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md slide-in-bottom">
        {/* Main Sign In Card */}
        <div
          className="glass-effect rounded-2xl p-8"
          style={{
            boxShadow: "0 8px 32px rgba(38,70,83,0.12)",
          }}
        >
          {/* Header Section */}
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "var(--primary-10)" }}
            >
              <FontAwesomeIcon
                icon={faUserShield}
                className="text-2xl"
                style={{ color: "var(--primary)" }}
              />
            </div>
            <h2
              className="text-2xl font-bold mb-2"
              style={{ color: "var(--secondary)" }}
            >
              Admin Sign-In
            </h2>
            <p style={{ color: "var(--secondary-70)" }}>
              Enter your credentials to access the Learn AI admin dashboard
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
              <div className="flex items-center space-x-3">
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  className="text-destructive"
                />
                <div>
                  <p className="text-destructive font-medium">
                    Invalid credentials
                  </p>
                  <p className="text-destructive/80 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--secondary)" }}
              >
                Email Address
                <span style={{ color: "var(--destructive)" }}>*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon
                    icon={faEnvelope}
                    style={{ color: "var(--secondary-50)" }}
                  />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full pl-10 pr-4 py-3 rounded-xl input-focus transition-all duration-200"
                  style={{
                    backgroundColor: "var(--input)",
                    borderColor: "var(--secondary-15)",
                    borderWidth: "1px",
                    color: "var(--secondary)",
                  }}
                  placeholder="admin@learnai.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--secondary)" }}
              >
                Password
                <span style={{ color: "var(--destructive)" }}>*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon
                    icon={faLock}
                    style={{ color: "var(--secondary-50)" }}
                  />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  className="w-full pl-10 pr-12 py-3 rounded-xl input-focus transition-all duration-200"
                  style={{
                    backgroundColor: "var(--input)",
                    borderColor: "var(--secondary-15)",
                    borderWidth: "1px",
                    color: "var(--secondary)",
                  }}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  required
                />
                <button
                  type="button"
                  onClick={togglePassword}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center transition-colors duration-200"
                  style={{ color: "var(--secondary-50)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--secondary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--secondary-50)";
                  }}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember-me"
                  name="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded focus:ring-2"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    borderColor: "var(--secondary-15)",
                    color: "var(--primary)",
                  }}
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 text-sm"
                  style={{ color: "var(--secondary)" }}
                >
                  Remember me
                </label>
              </div>
              <button
                type="button"
                className="text-sm font-medium transition-colors duration-200"
                style={{ color: "var(--primary)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--primary-80)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--primary)";
                }}
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={signing}
              className="w-full py-3 rounded-xl font-semibold btn-hover transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--primary-foreground)",
              }}
            >
              {signing ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <FontAwesomeIcon icon={faArrowRight} />
                </>
              )}
            </button>
          </form>

          {/* Additional Security Info */}
          <div className="mt-8 pt-6 border-t border-secondary/15">
            <div className="flex items-center justify-center space-x-6 text-sm text-secondary/70">
              <div className="flex items-center space-x-2">
                <FontAwesomeIcon icon={faShield} className="text-primary" />
                <span>SSL Encrypted</span>
              </div>
              <div className="flex items-center space-x-2">
                <FontAwesomeIcon icon={faClock} />
                <span>Session Timeout: 8hrs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Only Notice */}
        <div className="mt-6 text-center">
          <p className="text-sm text-secondary/70">
            <FontAwesomeIcon icon={faInfoCircle} className="mr-1" />
            This portal is restricted to authorized administrators only
          </p>
        </div>
      </div>
    </main>
  );
}
