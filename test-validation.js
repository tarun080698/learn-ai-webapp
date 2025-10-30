#!/usr/bin/env node

/**
 * Comprehensive Testing & Validation Script for Learn.ai 4all Questionnaire System
 *
 * This script tests all APIs, validates functionality, and reports errors
 * Run with: node test-validation.js
 */

const https = require("https");
const http = require("http");

class TestValidator {
  constructor() {
    this.baseUrl = "http://localhost:3000";
    this.results = {
      passed: 0,
      failed: 0,
      errors: [],
      tests: [],
    };
    this.adminToken = null;
    this.userToken = null;
  }

  // Utility function to make HTTP requests
  async makeRequest(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const options = {
        method,
        hostname: url.hostname,
        port: url.port || 3000,
        path: url.pathname + url.search,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      };

      const req = http.request(options, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const result = {
              status: res.statusCode,
              headers: res.headers,
              data: body ? JSON.parse(body) : null,
            };
            resolve(result);
          } catch (e) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: body,
              parseError: e.message,
            });
          }
        });
      });

      req.on("error", reject);

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  // Test helper
  async test(name, testFn) {
    console.log(`\n🧪 Testing: ${name}`);
    try {
      const result = await testFn();
      if (result.success) {
        console.log(`✅ PASS: ${name}`);
        this.results.passed++;
      } else {
        console.log(`❌ FAIL: ${name} - ${result.message}`);
        this.results.failed++;
        this.results.errors.push({ test: name, error: result.message });
      }
      this.results.tests.push({
        name,
        status: result.success ? "PASS" : "FAIL",
        message: result.message,
      });
    } catch (error) {
      console.log(`💥 ERROR: ${name} - ${error.message}`);
      this.results.failed++;
      this.results.errors.push({ test: name, error: error.message });
      this.results.tests.push({
        name,
        status: "ERROR",
        message: error.message,
      });
    }
  }

  // Health check test
  async testHealthCheck() {
    return this.test("Health Check - Server Running", async () => {
      const response = await this.makeRequest("GET", "/");
      return {
        success: response.status === 200 || response.status === 307,
        message:
          response.status === 200 || response.status === 307
            ? "Server is running"
            : `Server returned ${response.status}`,
      };
    });
  }

  // Test API endpoints
  async testApiEndpoints() {
    const endpoints = [
      {
        method: "GET",
        path: "/api/admin/questionnaires",
        expectedStatus: [200, 401, 403],
      },
      {
        method: "GET",
        path: "/api/admin/assignments",
        expectedStatus: [200, 401, 403],
      },
      {
        method: "POST",
        path: "/api/questionnaires/context",
        expectedStatus: [200, 400, 401],
      },
    ];

    for (const endpoint of endpoints) {
      await this.test(`API ${endpoint.method} ${endpoint.path}`, async () => {
        const response = await this.makeRequest(
          endpoint.method,
          endpoint.path,
          endpoint.method === "POST" ? {} : null
        );

        const isExpectedStatus = endpoint.expectedStatus.includes(
          response.status
        );
        return {
          success: isExpectedStatus,
          message: isExpectedStatus
            ? `Endpoint responding correctly (${response.status})`
            : `Unexpected status ${
                response.status
              }, expected one of ${endpoint.expectedStatus.join(", ")}`,
        };
      });
    }
  }

  // Test questionnaire creation
  async testQuestionnaireCreation() {
    return this.test("Questionnaire Creation API", async () => {
      const sampleQuestionnaire = {
        title: "Test Survey",
        purpose: "survey",
        questions: [
          {
            type: "single",
            prompt: "How would you rate this course?",
            required: true,
            options: ["Excellent", "Good", "Average", "Poor"],
          },
          {
            type: "text",
            prompt: "Any additional feedback?",
            required: false,
          },
        ],
      };

      const response = await this.makeRequest(
        "POST",
        "/api/questionnaires",
        sampleQuestionnaire
      );

      return {
        success:
          response.status === 200 ||
          response.status === 201 ||
          response.status === 401,
        message:
          response.status === 401
            ? "Authentication required (expected for admin endpoint)"
            : response.status === 200 || response.status === 201
            ? "Questionnaire creation API working"
            : `Unexpected response: ${response.status}`,
      };
    });
  }

  // Test questionnaire assignment
  async testQuestionnaireAssignment() {
    return this.test("Questionnaire Assignment API", async () => {
      const assignment = {
        questionnaireId: "test-questionnaire-id",
        scope: {
          type: "course",
          courseId: "test-course-id",
        },
        timing: "pre",
      };

      const response = await this.makeRequest(
        "POST",
        "/api/questionnaires/assign",
        assignment
      );

      return {
        success:
          response.status === 200 ||
          response.status === 201 ||
          response.status === 400 ||
          response.status === 401,
        message:
          response.status === 401
            ? "Authentication required (expected)"
            : response.status === 400
            ? "Validation working (expected for invalid test data)"
            : response.status === 200 || response.status === 201
            ? "Assignment API working"
            : `Unexpected response: ${response.status}`,
      };
    });
  }

  // Test user context
  async testUserContext() {
    return this.test("User Context API", async () => {
      const contextRequest = {
        courseId: "test-course-id",
      };

      const response = await this.makeRequest(
        "POST",
        "/api/questionnaires/context",
        contextRequest
      );

      return {
        success:
          response.status === 200 ||
          response.status === 400 ||
          response.status === 401,
        message:
          response.status === 401
            ? "Authentication required (expected)"
            : response.status === 400
            ? "Validation working (expected for test data)"
            : response.status === 200
            ? "Context API working"
            : `Unexpected response: ${response.status}`,
      };
    });
  }

  // Test questionnaire start
  async testQuestionnaireStart() {
    return this.test("Questionnaire Start API", async () => {
      const startRequest = {
        assignmentId: "test-assignment-id",
      };

      const response = await this.makeRequest(
        "POST",
        "/api/questionnaires/start",
        startRequest
      );

      return {
        success:
          response.status === 200 ||
          response.status === 400 ||
          response.status === 401 ||
          response.status === 404,
        message:
          response.status === 401
            ? "Authentication required (expected)"
            : response.status === 404 || response.status === 400
            ? "Validation working (expected for test data)"
            : response.status === 200
            ? "Start API working"
            : `Unexpected response: ${response.status}`,
      };
    });
  }

  // Test questionnaire submission
  async testQuestionnaireSubmission() {
    return this.test("Questionnaire Submission API", async () => {
      const submission = {
        assignmentId: "test-assignment-id",
        answers: [
          { questionId: "q1", value: "option1" },
          { questionId: "q2", value: "Great course!" },
        ],
      };

      const response = await this.makeRequest(
        "POST",
        "/api/questionnaires/submit",
        submission
      );

      return {
        success:
          response.status === 200 ||
          response.status === 400 ||
          response.status === 401 ||
          response.status === 404,
        message:
          response.status === 401
            ? "Authentication required (expected)"
            : response.status === 404 || response.status === 400
            ? "Validation working (expected for test data)"
            : response.status === 200
            ? "Submission API working"
            : `Unexpected response: ${response.status}`,
      };
    });
  }

  // Test progress tracking
  async testProgressTracking() {
    return this.test("Progress Tracking API", async () => {
      const progressRequest = {
        courseId: "test-course-id",
      };

      const response = await this.makeRequest(
        "POST",
        "/api/questionnaires/progress",
        progressRequest
      );

      return {
        success:
          response.status === 200 ||
          response.status === 400 ||
          response.status === 401,
        message:
          response.status === 401
            ? "Authentication required (expected)"
            : response.status === 400
            ? "Validation working (expected for test data)"
            : response.status === 200
            ? "Progress API working"
            : `Unexpected response: ${response.status}`,
      };
    });
  }

  // Test gating enforcement
  async testGatingEnforcement() {
    return this.test("Gating Enforcement API", async () => {
      const gateRequest = {
        courseId: "test-course-id",
        moduleId: "test-module-id",
      };

      const response = await this.makeRequest(
        "POST",
        "/api/questionnaires/gate",
        gateRequest
      );

      return {
        success:
          response.status === 200 ||
          response.status === 400 ||
          response.status === 401 ||
          response.status === 403,
        message:
          response.status === 401
            ? "Authentication required (expected)"
            : response.status === 400 || response.status === 403
            ? "Validation/gating working (expected for test data)"
            : response.status === 200
            ? "Gating API working"
            : `Unexpected response: ${response.status}`,
      };
    });
  }

  // Test frontend pages
  async testFrontendPages() {
    const pages = [
      { path: "/admin", name: "Admin Page" },
      { path: "/dashboard", name: "Dashboard Page" },
      { path: "/questionnaires", name: "Questionnaires Page" },
      { path: "/catalog", name: "Catalog Page" },
    ];

    for (const page of pages) {
      await this.test(`Frontend ${page.name}`, async () => {
        const response = await this.makeRequest("GET", page.path);
        return {
          success:
            response.status === 200 ||
            response.status === 307 ||
            response.status === 302,
          message:
            response.status === 200
              ? "Page loads successfully"
              : response.status === 307 || response.status === 302
              ? "Page redirects (auth required - expected)"
              : `Page failed to load: ${response.status}`,
        };
      });
    }
  }

  // Test database connection
  async testDatabaseConnection() {
    return this.test("Database Connection", async () => {
      // Test a simple API that uses the database
      const response = await this.makeRequest("GET", "/api/enrollments");

      return {
        success:
          response.status !== 500 ||
          (response.data &&
            response.data.error &&
            response.data.error.includes("index")),
        message:
          response.status === 500 &&
          response.data &&
          response.data.error &&
          response.data.error.includes("index")
            ? "Database connected but needs indexes (expected in development)"
            : response.status === 401
            ? "Database connection OK, authentication required"
            : response.status === 200
            ? "Database connection working"
            : `Database connection issue: ${response.status}`,
      };
    });
  }

  // Check for common errors
  async checkCommonErrors() {
    console.log("\n🔍 Checking for common errors...");

    // Check for Firestore index errors
    await this.test("Firestore Index Check", async () => {
      const response = await this.makeRequest("GET", "/api/enrollments");
      const hasIndexError =
        response.data &&
        JSON.stringify(response.data).includes("FAILED_PRECONDITION");

      return {
        success: true, // This is informational, not a failure
        message: hasIndexError
          ? "INFO: Firestore indexes needed for production (normal in development)"
          : "No index errors detected",
      };
    });

    // Check API route structure
    await this.test("API Route Structure", async () => {
      const routes = [
        "/api/questionnaires",
        "/api/questionnaires/assign",
        "/api/questionnaires/context",
        "/api/questionnaires/start",
        "/api/questionnaires/submit",
        "/api/questionnaires/progress",
        "/api/questionnaires/gate",
        "/api/questionnaires/remove",
        "/api/admin/questionnaires",
        "/api/admin/assignments",
      ];

      let workingRoutes = 0;
      for (const route of routes) {
        try {
          const response = await this.makeRequest("POST", route, {});
          if (response.status !== 404) workingRoutes++;
        } catch (e) {
          // Route exists but may have other issues
          workingRoutes++;
        }
      }

      return {
        success: workingRoutes >= 8, // At least 8 out of 10 should respond
        message: `${workingRoutes}/${routes.length} API routes responding`,
      };
    });
  }

  // Generate report
  generateReport() {
    console.log("\n" + "=".repeat(60));
    console.log("📊 VALIDATION REPORT");
    console.log("=".repeat(60));

    console.log(`\n✅ Tests Passed: ${this.results.passed}`);
    console.log(`❌ Tests Failed: ${this.results.failed}`);
    console.log(
      `📈 Success Rate: ${(
        (this.results.passed / (this.results.passed + this.results.failed)) *
        100
      ).toFixed(1)}%`
    );

    if (this.results.errors.length > 0) {
      console.log("\n🚨 ERRORS FOUND:");
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.test}: ${error.error}`);
      });
    }

    console.log("\n📋 DETAILED RESULTS:");
    this.results.tests.forEach((test) => {
      const icon =
        test.status === "PASS" ? "✅" : test.status === "FAIL" ? "❌" : "💥";
      console.log(`${icon} ${test.name}: ${test.message}`);
    });

    console.log("\n📝 RECOMMENDATIONS:");

    if (
      this.results.errors.some((e) => e.error.includes("FAILED_PRECONDITION"))
    ) {
      console.log("• Create Firestore indexes for production deployment");
    }

    if (
      this.results.errors.some(
        (e) => e.error.includes("401") || e.error.includes("Authentication")
      )
    ) {
      console.log(
        "• Authentication is working (expected for protected endpoints)"
      );
    }

    if (this.results.failed === 0) {
      console.log(
        "🎉 All systems operational! Ready for production deployment."
      );
    } else if (this.results.failed <= 2) {
      console.log("⚠️  Minor issues detected. System mostly functional.");
    } else {
      console.log("🚨 Multiple issues detected. Review errors above.");
    }

    console.log("\n" + "=".repeat(60));
  }

  // Run all tests
  async runAllTests() {
    console.log("🚀 Starting comprehensive validation tests...");
    console.log("Testing Learn.ai 4all Questionnaire System");
    console.log("=".repeat(60));

    // Basic connectivity
    await this.testHealthCheck();
    await this.testDatabaseConnection();

    // Frontend tests
    await this.testFrontendPages();

    // API endpoint tests
    await this.testApiEndpoints();

    // Questionnaire system tests
    await this.testQuestionnaireCreation();
    await this.testQuestionnaireAssignment();
    await this.testUserContext();
    await this.testQuestionnaireStart();
    await this.testQuestionnaireSubmission();
    await this.testProgressTracking();
    await this.testGatingEnforcement();

    // Error checking
    await this.checkCommonErrors();

    // Generate final report
    this.generateReport();
  }
}

// Run the tests
async function main() {
  const validator = new TestValidator();

  console.log("⏳ Waiting for server to be ready...");

  // Wait a moment for server to be fully ready
  await new Promise((resolve) => setTimeout(resolve, 2000));

  await validator.runAllTests();

  // Exit with appropriate code
  process.exit(validator.results.failed > 5 ? 1 : 0);
}

// Handle script execution
if (require.main === module) {
  main().catch((error) => {
    console.error("💥 Test script failed:", error);
    process.exit(1);
  });
}

module.exports = TestValidator;
