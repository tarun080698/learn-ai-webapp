import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">
                    AI
                  </span>
                </div>
                <span className="font-bold text-xl">Learn AI</span>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center space-x-4">
              <Link
                href="/catalog"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Catalog
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Login
              </Link>
              <Link
                href="/admin/login"
                className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4">
          <div className="text-center max-w-3xl">
            <h1 className="text-5xl font-bold tracking-tight mb-6">
              Master AI with
              <span className="text-primary"> Interactive Learning</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Comprehensive courses, hands-on projects, and personalized
              progress tracking. Learn artificial intelligence at your own pace
              with expert guidance.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/catalog"
                className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Browse Courses
              </Link>
              <Link
                href="/login"
                className="px-8 py-3 border border-border rounded-lg hover:bg-muted transition-colors font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="font-semibold mb-2">Personalized Learning</h3>
              <p className="text-muted-foreground">
                Track your progress and maintain learning streaks with our
                intelligent system.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="font-semibold mb-2">Hands-on Projects</h3>
              <p className="text-muted-foreground">
                Build real AI applications with guided tutorials and interactive
                modules.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="font-semibold mb-2">Progress Tracking</h3>
              <p className="text-muted-foreground">
                Monitor your learning journey with detailed analytics and
                achievements.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
