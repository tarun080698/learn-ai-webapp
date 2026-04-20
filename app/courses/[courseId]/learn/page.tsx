"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useAuth } from "@/app/(auth)/AuthProvider";
import { RouteGuard } from "@/app/components/RouteGuard";
import { PublicLayout } from "@/components/PublicLayout";
import { generateIdempotencyKey } from "@/utils/uuid";

const MarkdownPreview = dynamic(
  () => import("@uiw/react-md-editor").then((m) => m.default.Markdown),
  { ssr: false }
);

interface ModuleSummary {
  id: string;
  title: string;
  summary?: string;
  contentType: "video" | "text" | "pdf" | "link";
  estMinutes: number;
  index: number;
}

interface ModuleFull {
  id: string;
  courseId: string;
  index: number;
  title: string;
  summary: string;
  contentType: "video" | "text" | "pdf" | "link";
  contentUrl: string | null;
  body: string;
  estMinutes: number;
}

interface CourseData {
  id: string;
  title: string;
  modules: ModuleSummary[];
  enrollment?: { status: "enrolled" | null };
}

function toEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace(/^\//, "");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    // fall through
  }
  return url;
}

function LearnPageInner() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string;
  const { firebaseUser } = useAuth();

  const [course, setCourse] = useState<CourseData | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleFull | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [courseLoading, setCourseLoading] = useState(true);
  const [moduleLoading, setModuleLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedModules = useMemo(
    () =>
      [...(course?.modules || [])].sort(
        (a, b) => (a.index ?? 0) - (b.index ?? 0)
      ),
    [course]
  );

  const loadCourse = useCallback(async () => {
    if (!firebaseUser || !courseId) return;
    try {
      setCourseLoading(true);
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Failed to load course");
      }
      const data = await res.json();
      const c: CourseData = data.course;

      if (c.enrollment?.status !== "enrolled") {
        router.replace(`/courses/${courseId}`);
        return;
      }

      setCourse(c);
      const first = [...(c.modules || [])].sort(
        (a, b) => (a.index ?? 0) - (b.index ?? 0)
      )[0];
      if (first) setActiveModuleId(first.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load course");
    } finally {
      setCourseLoading(false);
    }
  }, [firebaseUser, courseId, router]);

  const loadProgress = useCallback(async () => {
    if (!firebaseUser || !courseId) return;
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`/api/progress?courseId=${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const ids: string[] = (data?.progress || [])
        .filter((p: { completed?: boolean }) => p.completed)
        .map((p: { moduleId: string }) => p.moduleId);
      setCompletedIds(new Set(ids));
    } catch {
      // non-fatal
    }
  }, [firebaseUser, courseId]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  useEffect(() => {
    const fetchModule = async () => {
      if (!firebaseUser || !activeModuleId) return;
      try {
        setModuleLoading(true);
        setActiveModule(null);
        const token = await firebaseUser.getIdToken();
        const res = await fetch(`/api/modules/${activeModuleId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error("Failed to load module");
        }
        const data = await res.json();
        setActiveModule(data.module);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load module");
      } finally {
        setModuleLoading(false);
      }
    };
    fetchModule();
  }, [firebaseUser, activeModuleId]);

  const handleMarkComplete = async () => {
    if (!firebaseUser || !activeModule || !course) return;
    try {
      setMarking(true);
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-idempotency-key": generateIdempotencyKey(),
        },
        body: JSON.stringify({
          courseId: course.id,
          moduleId: activeModule.id,
          moduleIndex: activeModule.index,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to mark complete");
      }
      setCompletedIds((prev) => new Set(prev).add(activeModule.id));

      // Auto-advance to the next module
      const currentIdx = sortedModules.findIndex(
        (m) => m.id === activeModule.id
      );
      const next = sortedModules[currentIdx + 1];
      if (next) setActiveModuleId(next.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update progress");
    } finally {
      setMarking(false);
    }
  };

  if (courseLoading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
          style={{ borderColor: "var(--primary)" }}
        ></div>
        <p className="mt-4" style={{ color: "var(--muted-foreground)" }}>
          Loading course…
        </p>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2
          className="text-xl font-semibold mb-4"
          style={{ color: "var(--secondary)" }}
        >
          {error}
        </h2>
        <Link
          href={`/courses/${courseId}`}
          className="inline-block px-6 py-3 rounded-lg font-medium"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
        >
          Back to Course
        </Link>
      </div>
    );
  }

  if (!course) return null;

  const completedCount = sortedModules.filter((m) =>
    completedIds.has(m.id)
  ).length;
  const progressPct =
    sortedModules.length > 0
      ? Math.floor((completedCount / sortedModules.length) * 100)
      : 0;
  const embedUrl = toEmbedUrl(activeModule?.contentUrl);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--secondary)" }}
          >
            {course.title}
          </h1>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            {completedCount} of {sortedModules.length} modules complete (
            {progressPct}%)
          </p>
        </div>
        <Link
          href={`/courses/${courseId}`}
          className="text-sm font-medium hover:opacity-80"
          style={{ color: "var(--primary)" }}
        >
          ← Course details
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside
          className="lg:col-span-1 rounded-xl p-4"
          style={{
            backgroundColor: "var(--card)",
            boxShadow:
              "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
          }}
        >
          <h2
            className="font-semibold mb-3"
            style={{ color: "var(--secondary)" }}
          >
            Modules
          </h2>
          {sortedModules.length === 0 ? (
            <p
              className="text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              No published modules yet.
            </p>
          ) : (
            <ul className="space-y-1">
              {sortedModules.map((m) => {
                const isActive = m.id === activeModuleId;
                const isDone = completedIds.has(m.id);
                return (
                  <li key={m.id}>
                    <button
                      onClick={() => setActiveModuleId(m.id)}
                      className="w-full text-left px-3 py-2 rounded-lg flex items-start gap-2 transition-colors hover:opacity-90"
                      style={{
                        backgroundColor: isActive
                          ? "var(--primary-10)"
                          : "transparent",
                        color: isActive
                          ? "var(--primary)"
                          : "var(--secondary)",
                      }}
                    >
                      <span className="mt-0.5 text-sm">
                        {isDone ? (
                          <i
                            className="fa-solid fa-circle-check"
                            style={{ color: "var(--primary)" }}
                          ></i>
                        ) : (
                          <i className="fa-regular fa-circle"></i>
                        )}
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-medium">
                          {m.index + 1}. {m.title}
                        </span>
                        <span
                          className="block text-xs"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          {m.estMinutes} min · {m.contentType}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Main content */}
        <main
          className="lg:col-span-3 rounded-xl p-6"
          style={{
            backgroundColor: "var(--card)",
            boxShadow:
              "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
          }}
        >
          {moduleLoading || !activeModule ? (
            <div className="py-20 text-center">
              <div
                className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto"
                style={{ borderColor: "var(--primary)" }}
              ></div>
              <p
                className="mt-3 text-sm"
                style={{ color: "var(--muted-foreground)" }}
              >
                Loading module…
              </p>
            </div>
          ) : (
            <>
              <header className="mb-6">
                <h2
                  className="text-2xl font-bold mb-2"
                  style={{ color: "var(--secondary)" }}
                >
                  {activeModule.title}
                </h2>
                {activeModule.summary && (
                  <p style={{ color: "var(--muted-foreground)" }}>
                    {activeModule.summary}
                  </p>
                )}
              </header>

              <section className="mb-6">
                {activeModule.contentType === "video" && embedUrl && (
                  <div
                    className="relative w-full"
                    style={{ paddingBottom: "56.25%" }}
                  >
                    <iframe
                      src={embedUrl}
                      title={activeModule.title}
                      className="absolute inset-0 w-full h-full rounded-lg"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}

                {activeModule.contentType === "text" && (
                  <div data-color-mode="light" className="prose max-w-none">
                    <MarkdownPreview source={activeModule.body || ""} />
                  </div>
                )}

                {activeModule.contentType === "pdf" &&
                  activeModule.contentUrl && (
                    <iframe
                      src={activeModule.contentUrl}
                      title={activeModule.title}
                      className="w-full rounded-lg border"
                      style={{ height: "75vh" }}
                    />
                  )}

                {activeModule.contentType === "link" &&
                  activeModule.contentUrl && (
                    <a
                      href={activeModule.contentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 rounded-lg font-medium"
                      style={{
                        backgroundColor: "var(--primary)",
                        color: "var(--primary-foreground)",
                      }}
                    >
                      Open resource
                      <i className="fa-solid fa-arrow-up-right-from-square ml-2"></i>
                    </a>
                  )}
              </section>

              <footer className="flex items-center justify-between border-t pt-4">
                <span
                  className="text-sm"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Module {activeModule.index + 1} of {sortedModules.length}
                </span>
                <button
                  onClick={handleMarkComplete}
                  disabled={marking || completedIds.has(activeModule.id)}
                  className="px-5 py-2 rounded-lg font-semibold disabled:opacity-60"
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "var(--primary-foreground)",
                  }}
                >
                  {completedIds.has(activeModule.id)
                    ? "Completed ✓"
                    : marking
                    ? "Saving…"
                    : "Mark Complete"}
                </button>
              </footer>
            </>
          )}
        </main>
      </div>

      {error && course && (
        <p
          className="mt-4 text-sm text-center"
          style={{ color: "var(--destructive)" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default function LearnPage() {
  return (
    <RouteGuard>
      <PublicLayout showPromoBanner={false}>
        <LearnPageInner />
      </PublicLayout>
    </RouteGuard>
  );
}
