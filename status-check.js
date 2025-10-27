#!/usr/bin/env node

/**
 * Quick Status Check Script for Learn AI Questionnaire System
 * Run with: node status-check.js
 */

const http = require("http");

class StatusChecker {
  constructor() {
    this.baseUrl = "http://localhost:3000";
  }

  async checkServer() {
    try {
      const response = await this.makeRequest("GET", "/");
      return response.status === 200 || response.status === 307;
    } catch {
      return false;
    }
  }

  async makeRequest(method, path) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: "localhost",
        port: 3000,
        path,
        method,
      };

      const req = http.request(options, (res) => {
        resolve({ status: res.statusCode });
      });

      req.on("error", reject);
      req.setTimeout(3000, () => reject(new Error("Timeout")));
      req.end();
    });
  }

  async checkEndpoints() {
    const endpoints = [
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

    let working = 0;
    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest("POST", endpoint);
        if (response.status !== 404) working++;
      } catch {
        // Endpoint might exist but have other issues
      }
    }

    return { working, total: endpoints.length };
  }

  async run() {
    console.log("🔍 Learn AI Questionnaire System - Quick Status Check");
    console.log("=".repeat(55));

    // Check if server is running
    console.log("📡 Checking server status...");
    const serverRunning = await this.checkServer();
    console.log(
      `${serverRunning ? "✅" : "❌"} Server: ${
        serverRunning ? "Running" : "Not responding"
      }`
    );

    if (!serverRunning) {
      console.log("\n💡 To start the server, run: npm run dev");
      return;
    }

    // Check API endpoints
    console.log("\n🔌 Checking API endpoints...");
    const { working, total } = await this.checkEndpoints();
    console.log(
      `${working === total ? "✅" : "⚠️"} APIs: ${working}/${total} responding`
    );

    // System status
    console.log("\n📊 System Status:");
    if (serverRunning && working === total) {
      console.log("✅ All systems operational! 🚀");
      console.log("\n🎯 Ready for:");
      console.log("   • Admin testing at http://localhost:3000/admin");
      console.log("   • User testing at http://localhost:3000/questionnaires");
      console.log("   • Full validation with: npm run test");
    } else if (serverRunning && working >= 8) {
      console.log("⚠️  System mostly operational");
      console.log("   • Some endpoints may need attention");
      console.log("   • Run: npm run test for detailed analysis");
    } else {
      console.log("❌ System needs attention");
      console.log("   • Multiple endpoints not responding");
      console.log("   • Check server logs for errors");
    }

    console.log("\n📖 Documentation:");
    console.log("   • FINAL_VALIDATION_REPORT.md - Complete system status");
    console.log("   • TESTING_REPORT.md - Testing workflows");
    console.log("   • INTEGRATION_SUMMARY.md - Technical details");

    console.log("\n" + "=".repeat(55));
  }
}

if (require.main === module) {
  new StatusChecker().run().catch(console.error);
}

module.exports = StatusChecker;
