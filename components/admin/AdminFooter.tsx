"use client";

export function AdminFooter() {
  return (
    <footer
      className="py-12"
      style={{
        backgroundColor: "var(--secondary)",
        color: "var(--secondary-foreground)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Learn AI Admin</h3>
            <p
              className="mb-4"
              style={{ color: "var(--secondary-foreground-80)" }}
            >
              Empowering educators with advanced learning management tools.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2">
              <li>
                <span style={{ color: "var(--secondary-foreground-80)" }}>
                  Dashboard
                </span>
              </li>
              <li>
                <span style={{ color: "var(--secondary-foreground-80)" }}>
                  Course Creation
                </span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <span style={{ color: "var(--secondary-foreground-80)" }}>
                  Documentation
                </span>
              </li>
              <li>
                <span style={{ color: "var(--secondary-foreground-80)" }}>
                  Contact Us
                </span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <span style={{ color: "var(--secondary-foreground-80)" }}>
                  Privacy Policy
                </span>
              </li>
              <li>
                <span style={{ color: "var(--secondary-foreground-80)" }}>
                  Terms of Service
                </span>
              </li>
            </ul>
          </div>
        </div>
        <div
          className="border-t mt-8 pt-8 text-center"
          style={{ borderColor: "var(--secondary-foreground-20)" }}
        >
          <p style={{ color: "var(--secondary-foreground-70)" }}>
            &copy; 2024 Learn AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
