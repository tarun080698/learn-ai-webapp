"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/app/(auth)/AuthProvider";
import { RouteGuard } from "@/app/components/RouteGuard";
import { PublicLayout } from "@/components/PublicLayout";
import { generateIdempotencyKey } from "@/utils/uuid";
import { QuestionnaireRunner } from "@/components/QuestionnaireRunner";

const MarkdownPreview = dynamic(
  () => import("@uiw/react-md-editor").then((m) => m.default.Markdown),
  { ssr: false }
);

type LessonKind = "video" | "pdf" | "image" | "link" | "text" | "quiz";

interface Lesson {
  id: string;
  title: string;
  kind: LessonKind;
  url?: string | null;
  body?: string;
  isPrimary: boolean;
  // For quiz lessons:
  assignmentId?: string;
  timing?: "pre" | "post";
}

interface ModuleAsset {
  id: string;
  kind: "pdf" | "video" | "image" | "link";
  url: string;
  title?: string;
  body?: string;
  order: number;
}

interface ModuleData {
  id: string;
  index: number;
  title: string;
  summary?: string;
  contentType: "video" | "text" | "pdf" | "image" | "link";
  contentUrl?: string | null;
  body?: string;
  estMinutes: number;
  assets?: ModuleAsset[];
}

interface CourseData {
  id: string;
  title: string;
  modules: ModuleData[];
  enrollment?: {
    status: "enrolled" | null;
    lastModuleIndex?: number;
  };
}

interface ContextEntry {
  assignmentId: string;
  completed: boolean;
}

interface ContextResponse {
  preCourse?: ContextEntry;
  postCourse?: ContextEntry;
  preModule?: ContextEntry;
  postModule?: ContextEntry;
}

const lessonsStorageKey = (courseId: string) => `learn:${courseId}:lessons`;

function readLessonProgress(courseId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(lessonsStorageKey(courseId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return new Set(parsed.map(String));
  } catch {
    // ignore
  }
  return new Set();
}

function writeLessonProgress(courseId: string, ids: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      lessonsStorageKey(courseId),
      JSON.stringify(Array.from(ids))
    );
  } catch {
    // ignore
  }
}

function buildContentLessons(module: ModuleData): Lesson[] {
  const lessons: Lesson[] = [];
  const hasPrimary = !!(module.body && module.body.trim()) || !!module.contentUrl;
  if (hasPrimary) {
    lessons.push({
      id: `${module.id}:main`,
      title: module.title,
      kind: module.contentType,
      url: module.contentUrl,
      body: module.body,
      isPrimary: true,
    });
  }
  const assets = [...(module.assets ?? [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );
  assets.forEach((asset, idx) => {
    lessons.push({
      id: asset.id,
      title: asset.title || `Lesson ${idx + (hasPrimary ? 2 : 1)}`,
      kind: asset.kind,
      url: asset.url,
      body: asset.body,
      isPrimary: false,
    });
  });
  return lessons;
}

function buildModuleLessons(
  module: ModuleData,
  ctx: ContextResponse | undefined
): Lesson[] {
  const lessons: Lesson[] = [];
  if (ctx?.preModule) {
    lessons.push({
      id: `${module.id}:pre-quiz`,
      title: "Pre-module quiz",
      kind: "quiz",
      isPrimary: false,
      assignmentId: ctx.preModule.assignmentId,
      timing: "pre",
    });
  }
  lessons.push(...buildContentLessons(module));
  if (ctx?.postModule) {
    lessons.push({
      id: `${module.id}:post-quiz`,
      title: "Post-module quiz",
      kind: "quiz",
      isPrimary: false,
      assignmentId: ctx.postModule.assignmentId,
      timing: "post",
    });
  }
  return lessons;
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
    /* fall through */
  }
  return url;
}

function LessonViewer({ lesson }: { lesson: Lesson }) {
  if (lesson.kind === "video") {
    const embed = toEmbedUrl(lesson.url ?? null);
    if (!embed) {
      return <p style={{ color: "var(--muted-foreground)" }}>Missing video URL.</p>;
    }
    const isHostedFile = /\.(mp4|webm|ogg)(\?.*)?$/i.test(embed);
    return (
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        {isHostedFile ? (
          <video
            src={embed}
            controls
            className="absolute inset-0 w-full h-full rounded-lg bg-black"
          />
        ) : (
          <iframe
            src={embed}
            title={lesson.title}
            className="absolute inset-0 w-full h-full rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
    );
  }

  if (lesson.kind === "pdf") {
    if (!lesson.url) {
      return <p style={{ color: "var(--muted-foreground)" }}>Missing PDF URL.</p>;
    }
    return (
      <iframe
        src={lesson.url}
        title={lesson.title}
        className="w-full rounded-lg border"
        style={{ height: "75vh" }}
      />
    );
  }

  if (lesson.kind === "image") {
    if (!lesson.url) {
      return <p style={{ color: "var(--muted-foreground)" }}>Missing image URL.</p>;
    }
    return (
      <div className="w-full flex justify-center">
        <Image
          src={lesson.url}
          alt={lesson.title}
          width={1200}
          height={800}
          className="max-w-full h-auto rounded-lg"
          unoptimized
        />
      </div>
    );
  }

  if (lesson.kind === "link") {
    if (!lesson.url) {
      return <p style={{ color: "var(--muted-foreground)" }}>Missing link URL.</p>;
    }
    return (
      <div>
        <a
          href={lesson.url}
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
        <p
          className="mt-3 text-sm break-all"
          style={{ color: "var(--muted-foreground)" }}
        >
          {lesson.url}
        </p>
      </div>
    );
  }

  // text
  return (
    <div data-color-mode="light" className="prose max-w-none">
      <MarkdownPreview source={lesson.body || ""} />
    </div>
  );
}

function lessonIcon(kind: LessonKind): string {
  switch (kind) {
    case "video":
      return "fa-play";
    case "pdf":
      return "fa-file-pdf";
    case "image":
      return "fa-image";
    case "link":
      return "fa-link";
    case "quiz":
      return "fa-clipboard-question";
    default:
      return "fa-file-lines";
  }
}

function LearnPageInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = params?.courseId as string;
  const requestedModuleId = searchParams?.get("module") || null;
  const { firebaseUser } = useAuth();

  const [course, setCourse] = useState<CourseData | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(
    new Set()
  );
  const [expandedModuleIds, setExpandedModuleIds] = useState<Set<string>>(
    new Set()
  );
  const [courseLoading, setCourseLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [courseCtx, setCourseCtx] = useState<ContextResponse>({});
  const [moduleCtxByModuleId, setModuleCtxByModuleId] = useState<
    Record<string, ContextResponse>
  >({});
  const [showCourseQuiz, setShowCourseQuiz] = useState<"pre" | "post" | null>(
    null
  );

  const sortedModules = useMemo(
    () =>
      [...(course?.modules || [])].sort(
        (a, b) => (a.index ?? 0) - (b.index ?? 0)
      ),
    [course]
  );

  // Build the lesson list per module, mixing in pre/post-module quizzes from context.
  const lessonsByModuleId = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    sortedModules.forEach((m) => {
      map.set(m.id, buildModuleLessons(m, moduleCtxByModuleId[m.id]));
    });
    return map;
  }, [sortedModules, moduleCtxByModuleId]);

  const activeModule = useMemo(
    () => sortedModules.find((m) => m.id === activeModuleId) || null,
    [sortedModules, activeModuleId]
  );

  const activeLessons = activeModule
    ? lessonsByModuleId.get(activeModule.id) || []
    : [];
  const activeLesson =
    activeLessons.find((l) => l.id === activeLessonId) || activeLessons[0] || null;

  // Post-course quiz appears once every module is complete.
  const allModulesComplete =
    sortedModules.length > 0 &&
    sortedModules.every((m) => completedIds.has(m.id));

  const loadCourse = useCallback(async () => {
    if (!firebaseUser || !courseId) return;
    try {
      setCourseLoading(true);
      const token = await firebaseUser.getIdToken();
      const res = await fetch(`/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load course");
      const data = await res.json();
      const c: CourseData = data.course;

      if (c.enrollment?.status !== "enrolled") {
        router.replace(`/courses/${courseId}`);
        return;
      }

      setCourse(c);
      setCompletedLessonIds(readLessonProgress(courseId));

      const sorted = [...(c.modules || [])].sort(
        (a, b) => (a.index ?? 0) - (b.index ?? 0)
      );
      const fromQuery =
        requestedModuleId && sorted.find((m) => m.id === requestedModuleId);
      const fromResume = sorted.find(
        (m) => m.index === (c.enrollment?.lastModuleIndex ?? 0)
      );
      const initial = fromQuery || fromResume || sorted[0];
      if (initial) {
        setActiveModuleId(initial.id);
        setExpandedModuleIds(new Set([initial.id]));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load course");
    } finally {
      setCourseLoading(false);
    }
  }, [firebaseUser, courseId, router, requestedModuleId]);

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

  const fetchCtx = useCallback(
    async (moduleId?: string): Promise<ContextResponse | null> => {
      if (!firebaseUser || !courseId) return null;
      try {
        const token = await firebaseUser.getIdToken();
        const url = moduleId
          ? `/api/questionnaires/context?courseId=${courseId}&moduleId=${moduleId}`
          : `/api/questionnaires/context?courseId=${courseId}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          console.warn(
            "[learn] questionnaire context fetch failed",
            res.status,
            url
          );
          return null;
        }
        const data = (await res.json()) as ContextResponse;
        console.log("[learn] questionnaire context", {
          scope: moduleId ? `module:${moduleId}` : "course",
          data,
        });
        return data;
      } catch (err) {
        console.warn("[learn] questionnaire context error", err);
        return null;
      }
    },
    [firebaseUser, courseId]
  );

  const refreshCourseCtx = useCallback(async () => {
    const data = await fetchCtx();
    if (data) {
      setCourseCtx({
        preCourse: data.preCourse,
        postCourse: data.postCourse,
      });
    }
  }, [fetchCtx]);

  const refreshModuleCtx = useCallback(
    async (moduleId: string) => {
      const data = await fetchCtx(moduleId);
      if (data) {
        setModuleCtxByModuleId((prev) => ({
          ...prev,
          [moduleId]: {
            preModule: data.preModule,
            postModule: data.postModule,
          },
        }));
      }
    },
    [fetchCtx]
  );

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  useEffect(() => {
    if (course) refreshCourseCtx();
  }, [course, refreshCourseCtx]);

  // Prefetch module-level context for every module after course loads.
  useEffect(() => {
    if (!course) return;
    sortedModules.forEach((m) => {
      if (!moduleCtxByModuleId[m.id]) refreshModuleCtx(m.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, sortedModules.length]);

  // When the active module changes, reset lesson selection to its first lesson.
  useEffect(() => {
    if (!activeModule) return;
    const lessons = lessonsByModuleId.get(activeModule.id) || [];
    setActiveLessonId(lessons[0]?.id ?? null);
  }, [activeModule, lessonsByModuleId]);

  const persistLessons = (next: Set<string>) => {
    setCompletedLessonIds(next);
    writeLessonProgress(courseId, next);
  };

  const handleSelectLesson = (moduleId: string, lessonId: string) => {
    setShowCourseQuiz(null);
    setActiveModuleId(moduleId);
    setActiveLessonId(lessonId);
    setExpandedModuleIds((prev) => {
      const next = new Set(prev);
      next.add(moduleId);
      return next;
    });
  };

  const handleToggleExpand = (moduleId: string) => {
    setExpandedModuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const handleMarkLessonComplete = () => {
    if (!activeModule || !activeLesson) return;
    const next = new Set(completedLessonIds);
    next.add(activeLesson.id);
    persistLessons(next);

    // Auto-advance to next lesson within the module.
    const idx = activeLessons.findIndex((l) => l.id === activeLesson.id);
    const nextLesson = activeLessons[idx + 1];
    if (nextLesson) setActiveLessonId(nextLesson.id);
  };

  const handleMarkComplete = async () => {
    if (!firebaseUser || !activeModule || !course) return;
    try {
      setMarking(true);
      setError(null);
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
        const data = await res.json().catch(() => ({}));
        if (data?.code === "gating_requirement_not_met") {
          throw new Error(
            data.message || "A required questionnaire must be completed first."
          );
        }
        throw new Error(data?.message || "Failed to mark complete");
      }
      setCompletedIds((prev) => new Set(prev).add(activeModule.id));

      // Drop this module's lesson markers from local storage to keep it bounded.
      const nextLessons = new Set(completedLessonIds);
      activeLessons.forEach((l) => nextLessons.delete(l.id));
      persistLessons(nextLessons);

      // Advance to the next module.
      const currentIdx = sortedModules.findIndex(
        (m) => m.id === activeModule.id
      );
      const next = sortedModules[currentIdx + 1];
      if (next) {
        setActiveModuleId(next.id);
        setExpandedModuleIds((prev) => {
          const ns = new Set(prev);
          ns.add(next.id);
          return ns;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update progress");
    } finally {
      setMarking(false);
    }
  };

  const handleQuizComplete = async () => {
    if (showCourseQuiz === "pre") {
      await refreshCourseCtx();
      setShowCourseQuiz(null);
      // Move to first module after pre-course quiz completion
      const first = sortedModules[0];
      if (first) setActiveModuleId(first.id);
      return;
    }
    if (showCourseQuiz === "post") {
      await refreshCourseCtx();
      setShowCourseQuiz(null);
      return;
    }
    if (!activeModule || !activeLesson) return;
    // Mark this quiz lesson done in localStorage too so the sidebar shows ✓.
    const nextLessons = new Set(completedLessonIds);
    nextLessons.add(activeLesson.id);
    persistLessons(nextLessons);
    await refreshModuleCtx(activeModule.id);
    // Auto-advance.
    const idx = activeLessons.findIndex((l) => l.id === activeLesson.id);
    const next = activeLessons[idx + 1];
    if (next) setActiveLessonId(next.id);
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

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2
          className="text-xl font-semibold mb-4"
          style={{ color: "var(--secondary)" }}
        >
          {error || "Course unavailable"}
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

  const completedCount = sortedModules.filter((m) =>
    completedIds.has(m.id)
  ).length;
  const progressPct =
    sortedModules.length > 0
      ? Math.floor((completedCount / sortedModules.length) * 100)
      : 0;

  // Module-complete gating: all lessons (content + quizzes) must be done.
  const moduleCtx = activeModule
    ? moduleCtxByModuleId[activeModule.id]
    : undefined;
  const postModuleQuizPending =
    !!moduleCtx?.postModule && moduleCtx.postModule.completed === false;
  const isLessonDone = (l: Lesson) => {
    if (l.kind === "quiz") {
      const flag =
        l.timing === "pre"
          ? moduleCtx?.preModule?.completed
          : moduleCtx?.postModule?.completed;
      return !!flag;
    }
    return completedLessonIds.has(l.id);
  };
  const allLessonsDone =
    activeLessons.length > 0 && activeLessons.every(isLessonDone);
  const moduleAlreadyComplete =
    !!activeModule && completedIds.has(activeModule.id);
  const moduleCompleteDisabled =
    marking ||
    !activeModule ||
    moduleAlreadyComplete ||
    !allLessonsDone ||
    postModuleQuizPending;
  const moduleCompleteHelp = moduleAlreadyComplete
    ? null
    : postModuleQuizPending
    ? "Complete the post-module quiz first."
    : !allLessonsDone
    ? "Mark every lesson in this module complete first."
    : null;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
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
          <div
            className="mt-2 h-2 w-64 rounded-full"
            style={{ backgroundColor: "var(--muted)" }}
          >
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                backgroundColor: "var(--primary)",
                width: `${progressPct}%`,
              }}
            />
          </div>
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
            Course content
          </h2>

          {/* Pre-course quiz row */}
          {courseCtx.preCourse && (
            <CourseQuizRow
              label="Intro quiz"
              completed={courseCtx.preCourse.completed}
              active={showCourseQuiz === "pre"}
              onClick={() => {
                setShowCourseQuiz("pre");
                setActiveModuleId(null);
              }}
            />
          )}

          {sortedModules.length === 0 ? (
            <p
              className="text-sm mt-2"
              style={{ color: "var(--muted-foreground)" }}
            >
              No published modules yet.
            </p>
          ) : (
            <ul className="space-y-2 mt-2">
              {sortedModules.map((m) => {
                const isOpen = expandedModuleIds.has(m.id);
                const isActiveModule = m.id === activeModuleId;
                const isDone = completedIds.has(m.id);
                const lessons = lessonsByModuleId.get(m.id) || [];
                return (
                  <li key={m.id}>
                    <button
                      onClick={() => {
                        handleToggleExpand(m.id);
                        setShowCourseQuiz(null);
                        setActiveModuleId(m.id);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg flex items-start gap-2 transition-colors hover:opacity-90"
                      style={{
                        backgroundColor: isActiveModule
                          ? "var(--primary-10)"
                          : "transparent",
                        color: isActiveModule
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
                          {lessons.length}{" "}
                          {lessons.length === 1 ? "lesson" : "lessons"} ·{" "}
                          {m.estMinutes} min
                        </span>
                      </span>
                      <i
                        className={`fa-solid text-xs mt-1 ${
                          isOpen ? "fa-chevron-down" : "fa-chevron-right"
                        }`}
                        style={{ color: "var(--muted-foreground)" }}
                      ></i>
                    </button>
                    {isOpen && lessons.length > 0 && (
                      <ul className="mt-1 ml-7 space-y-1">
                        {lessons.map((lesson) => {
                          const isActiveLesson =
                            isActiveModule && lesson.id === activeLesson?.id;
                          const lessonDone = completedLessonIds.has(lesson.id);
                          const ctxFlag =
                            lesson.kind === "quiz"
                              ? lesson.timing === "pre"
                                ? moduleCtxByModuleId[m.id]?.preModule?.completed
                                : moduleCtxByModuleId[m.id]?.postModule?.completed
                              : undefined;
                          const isQuizDone = lesson.kind === "quiz" && !!ctxFlag;
                          return (
                            <li key={lesson.id}>
                              <button
                                onClick={() =>
                                  handleSelectLesson(m.id, lesson.id)
                                }
                                className="w-full text-left px-2 py-1 rounded text-sm flex items-center gap-2 hover:opacity-90"
                                style={{
                                  backgroundColor: isActiveLesson
                                    ? "var(--primary-10)"
                                    : "transparent",
                                  color: isActiveLesson
                                    ? "var(--primary)"
                                    : "var(--muted-foreground)",
                                }}
                              >
                                <i
                                  className={`fa-solid text-xs ${
                                    lessonDone || isQuizDone
                                      ? "fa-circle-check"
                                      : lessonIcon(lesson.kind)
                                  }`}
                                  style={
                                    lessonDone || isQuizDone
                                      ? { color: "var(--primary)" }
                                      : undefined
                                  }
                                ></i>
                                <span className="truncate">{lesson.title}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {isOpen && lessons.length === 0 && (
                      <p
                        className="mt-1 ml-7 text-xs italic"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        No lessons in this module yet.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {/* Post-course quiz row, only after every module is complete */}
          {courseCtx.postCourse && allModulesComplete && (
            <div className="mt-3">
              <CourseQuizRow
                label="Wrap-up quiz"
                completed={courseCtx.postCourse.completed}
                active={showCourseQuiz === "post"}
                onClick={() => {
                  setShowCourseQuiz("post");
                  setActiveModuleId(null);
                }}
              />
            </div>
          )}
        </aside>

        {/* Main pane */}
        <main
          className="lg:col-span-3 rounded-xl p-6"
          style={{
            backgroundColor: "var(--card)",
            boxShadow:
              "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
          }}
        >
          {showCourseQuiz === "pre" && courseCtx.preCourse ? (
            <>
              <header className="mb-4">
                <p
                  className="text-xs uppercase tracking-wide mb-1"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Course quiz
                </p>
                <h2
                  className="text-2xl font-bold"
                  style={{ color: "var(--secondary)" }}
                >
                  Intro quiz
                </h2>
              </header>
              <QuestionnaireRunner
                assignmentId={courseCtx.preCourse.assignmentId}
                onComplete={handleQuizComplete}
                embedded
              />
            </>
          ) : showCourseQuiz === "post" && courseCtx.postCourse ? (
            <>
              <header className="mb-4">
                <p
                  className="text-xs uppercase tracking-wide mb-1"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Course quiz
                </p>
                <h2
                  className="text-2xl font-bold"
                  style={{ color: "var(--secondary)" }}
                >
                  Wrap-up quiz
                </h2>
              </header>
              <QuestionnaireRunner
                assignmentId={courseCtx.postCourse.assignmentId}
                onComplete={handleQuizComplete}
                embedded
              />
            </>
          ) : !activeModule ? (
            <p style={{ color: "var(--muted-foreground)" }}>
              Select a module to begin.
            </p>
          ) : !activeLesson ? (
            <div>
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
              <p style={{ color: "var(--muted-foreground)" }}>
                This module has no lessons yet. Ask an admin to add primary
                content or assets.
              </p>
            </div>
          ) : (
            <>
              <header className="mb-6">
                <p
                  className="text-xs uppercase tracking-wide mb-1"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Module {activeModule.index + 1}: {activeModule.title}
                </p>
                <h2
                  className="text-2xl font-bold mb-2"
                  style={{ color: "var(--secondary)" }}
                >
                  {activeLesson.title}
                </h2>
                {activeLesson.isPrimary && activeModule.summary && (
                  <p style={{ color: "var(--muted-foreground)" }}>
                    {activeModule.summary}
                  </p>
                )}
              </header>

              <section className="mb-6">
                {activeLesson.kind === "quiz" && activeLesson.assignmentId ? (
                  <QuestionnaireRunner
                    assignmentId={activeLesson.assignmentId}
                    onComplete={handleQuizComplete}
                    embedded
                  />
                ) : (
                  <LessonViewer lesson={activeLesson} />
                )}
              </section>

              <footer className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <div className="flex items-center gap-2 text-sm">
                  {activeLessons.map((l, idx) => (
                    <button
                      key={l.id}
                      onClick={() =>
                        handleSelectLesson(activeModule.id, l.id)
                      }
                      className="w-2.5 h-2.5 rounded-full"
                      title={l.title}
                      style={{
                        backgroundColor:
                          l.id === activeLesson.id
                            ? "var(--primary)"
                            : "var(--muted)",
                      }}
                      aria-label={`Lesson ${idx + 1}: ${l.title}`}
                    />
                  ))}
                  <span
                    className="ml-2 text-xs"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Lesson{" "}
                    {activeLessons.findIndex((l) => l.id === activeLesson.id) +
                      1}{" "}
                    of {activeLessons.length}
                  </span>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {activeLesson.kind === "quiz" ? (
                    <span
                      className="text-sm"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Submit the quiz above to mark it complete.
                    </span>
                  ) : (
                    <button
                      onClick={handleMarkLessonComplete}
                      disabled={completedLessonIds.has(activeLesson.id)}
                      className="px-4 py-2 rounded-lg font-medium disabled:opacity-60"
                      style={{
                        backgroundColor: "var(--card)",
                        color: "var(--secondary)",
                        boxShadow:
                          "0 1px 2px rgba(38,70,83,0.06), 0 8px 24px rgba(38,70,83,0.08)",
                      }}
                    >
                      {completedLessonIds.has(activeLesson.id)
                        ? "Lesson completed ✓"
                        : "Mark lesson complete"}
                    </button>
                  )}

                  <button
                    onClick={handleMarkComplete}
                    disabled={moduleCompleteDisabled}
                    className="px-5 py-2 rounded-lg font-semibold disabled:opacity-60"
                    style={{
                      backgroundColor: "var(--primary)",
                      color: "var(--primary-foreground)",
                    }}
                  >
                    {moduleAlreadyComplete
                      ? "Module completed ✓"
                      : marking
                      ? "Saving…"
                      : "Mark module complete"}
                  </button>
                  {moduleCompleteHelp && (
                    <span
                      className="text-xs"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {moduleCompleteHelp}
                    </span>
                  )}
                </div>
              </footer>
            </>
          )}
        </main>
      </div>

      {error && (
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

interface CourseQuizRowProps {
  label: string;
  completed: boolean;
  active: boolean;
  onClick: () => void;
}

function CourseQuizRow({ label, completed, active, onClick }: CourseQuizRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors hover:opacity-90"
      style={{
        backgroundColor: active ? "var(--primary-10)" : "transparent",
        color: active ? "var(--primary)" : "var(--secondary)",
      }}
    >
      <i
        className={`fa-solid ${
          completed ? "fa-circle-check" : "fa-clipboard-question"
        }`}
        style={completed ? { color: "var(--primary)" } : undefined}
      ></i>
      <span className="text-sm font-medium">{label}</span>
    </button>
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
