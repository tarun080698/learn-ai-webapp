"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";

/**
 * CoursePromoVideoSection
 * A self‑contained, responsive section that showcases a YouTube video.
 * - Matches your Tailwind + brand token style (primary/secondary/accent colors)
 * - Thumbnail card with big Play button; clicking opens an accessible modal
 * - Also includes headline, copy, and a CTA button to open the video
 * - No external deps; unmounts iframe on close to stop playback
 *
 * Drop-in usage (app/page.tsx or any client component):
 *   <CoursePromoVideoSection youtubeUrl="https://youtu.be/z6nIE9WAPYw" />
 */

// --- Helpers ---
function parseYouTubeId(input?: string): string | null {
  if (!input) return null;
  try {
    // Support youtu.be, youtube.com/watch?v=, and embed URLs
    const url = new URL(input);
    if (url.hostname === "youtu.be") return url.pathname.slice(1);
    if (url.hostname.includes("youtube.com")) {
      if (url.pathname.startsWith("/embed/"))
        return url.pathname.split("/").pop() || null;
      const v = url.searchParams.get("v");
      if (v) return v;
    }
  } catch (_) {
    // Not a URL, maybe it's already an ID
    if (/^[a-zA-Z0-9_-]{6,}$/.test(input)) return input;
  }
  return null;
}

function YouTubeThumb({ id, alt }: { id: string; alt: string }) {
  // Default to HQ thumbnail; swap to standard if HQ not found
  const [src, setSrc] = useState(
    `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
  );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      onError={() => setSrc(`https://img.youtube.com/vi/${id}/hqdefault.jpg`)}
      loading="lazy"
    />
  );
}

function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const elRef = useRef<HTMLElement | null>(null);
  if (!elRef.current && typeof document !== "undefined") {
    elRef.current = document.createElement("div");
  }
  useEffect(() => {
    const el = elRef.current!;
    document.body.appendChild(el);
    setMounted(true);
    return () => {
      document.body.removeChild(el);
    };
  }, []);
  return mounted && elRef.current
    ? ReactDOM.createPortal(children, elRef.current)
    : null;
}

function VideoModal({
  open,
  onClose,
  videoId,
  title = "Video player",
}: {
  open: boolean;
  onClose: () => void;
  videoId: string;
  title?: string;
}) {
  const escHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("overflow-hidden");
    window.addEventListener("keydown", escHandler as any);
    return () => {
      window.removeEventListener("keydown", escHandler as any);
      document.body.classList.remove("overflow-hidden");
    };
  }, [open]);

  if (!open) return null;

  const embed = `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`;

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed inset-0 z-[100] flex items-center justify-center"
      >
        <div
          className="absolute inset-0 backdrop-blur-sm"
          onClick={onClose}
          style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
        />
        <div
          className="relative z-[101] w-[92vw] md:w-[80vw] lg:w-[960px] aspect-video rounded-2xl overflow-hidden"
          style={{
            backgroundColor: "var(--card)",
            boxShadow: "var(--shadow-lg)",
            border: "1px solid var(--secondary-20)",
          }}
        >
          <button
            onClick={onClose}
            className="absolute right-3 top-3 inline-flex items-center justify-center h-10 w-10 rounded-full hover:opacity-90 focus:outline-none focus:ring-2 transition-all"
            style={
              {
                backgroundColor: "var(--secondary-90)",
                color: "var(--secondary-foreground)",
                "--tw-ring-color": "var(--primary)",
              } as React.CSSProperties
            }
            aria-label="Close video"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path
                fillRule="evenodd"
                d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          {/* Unmounting the iframe when closed stops playback */}
          <iframe
            title={title}
            src={embed}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      </div>
    </Portal>
  );
}

export default function CoursePromoVideoSection({
  youtubeUrl = "https://youtu.be/z6nIE9WAPYw",
  eyebrow = "See it in action",
  heading = "Build, learn, and level up with Learn.ai",
  subheading = "Watch a quick walkthrough of how learners enroll, progress through modules, and finish with certificates.",
  bullets = [
    "Enroll instantly and resume anytime",
    "Clean, fast UI with helpful module previews",
    "Optional pre/post quizzes for mastery",
    "Works great on mobile and desktop",
  ],
  ctaLabel = "Watch the video",
}: {
  youtubeUrl?: string;
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  bullets?: string[];
  ctaLabel?: string;
}) {
  const parsedId = useMemo(
    () => parseYouTubeId(youtubeUrl) || "z6nIE9WAPYw",
    [youtubeUrl]
  );
  const [open, setOpen] = useState(false);

  return (
    <section
      className="relative py-20"
      style={{
        background:
          "linear-gradient(to bottom, var(--secondary-5), var(--background), var(--background))",
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-24 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at top, var(--primary-10), transparent, transparent)",
        }}
      />

      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Copy */}
          <div>
            <p
              className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium mb-4"
              style={{
                backgroundColor: "var(--accent-10)",
                color: "var(--accent)",
              }}
            >
              {eyebrow}
            </p>
            <h2
              className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4"
              style={{ color: "var(--secondary)" }}
            >
              {heading}
            </h2>
            <p
              className="text-lg leading-relaxed mb-6"
              style={{ color: "var(--secondary-80)" }}
            >
              {subheading}
            </p>
            <ul className="space-y-3 mb-8">
              {bullets.map((b, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3"
                  style={{ color: "var(--secondary-80)" }}
                >
                  <span
                    className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: "var(--primary-10)",
                      color: "var(--primary)",
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2.25 12a9.75 9.75 0 1119.5 0 9.75 9.75 0 01-19.5 0zm14.03-1.53a.75.75 0 10-1.06-1.06l-4.72 4.72-1.72-1.72a.75.75 0 10-1.06 1.06l2.25 2.25c.3.3.77.3 1.06 0l5.25-5.25z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <span className="text-base">{b}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-foreground)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M4.5 5.653c0-1.427 1.529-2.33 2.782-1.643l10.42 5.597c1.296.695 1.296 2.59 0 3.285L7.282 18.49C6.03 19.177 4.5 18.274 4.5 16.847V5.653z" />
                </svg>
                {ctaLabel}
              </button>
              <span
                className="text-sm"
                style={{ color: "var(--secondary-60)" }}
              >
                2 min demo
              </span>
            </div>
          </div>

          {/* Video Card */}
          <div>
            <div
              role="button"
              aria-label="Open video"
              tabIndex={0}
              onClick={() => setOpen(true)}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") && setOpen(true)
              }
              className="group relative overflow-hidden rounded-2xl cursor-pointer"
              style={{
                border: "1px solid var(--secondary-15)",
                backgroundColor: "var(--card)",
                boxShadow: "var(--shadow-lg)",
              }}
            >
              <div className="aspect-video w-full">
                <YouTubeThumb id={parsedId} alt="Course video preview" />
              </div>

              {/* Gradient + Play */}
              <div
                className="pointer-events-none absolute inset-0 opacity-70 group-hover:opacity-80 transition-opacity"
                style={{
                  background:
                    "linear-gradient(to top right, var(--secondary-50), var(--secondary-10), transparent)",
                }}
              />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="group/play relative">
                  <div
                    className="absolute inset-0 rounded-full blur-xl opacity-60 group-hover/play:opacity-80 transition"
                    style={{ backgroundColor: "var(--primary-10)" }}
                  />
                  <div
                    className="relative inline-flex h-16 w-16 items-center justify-center rounded-full shadow-lg ring-4 group-hover/play:scale-105 transition-transform"
                    style={
                      {
                        backgroundColor: "var(--primary)",
                        color: "var(--primary-foreground)",
                        "--tw-ring-color": "rgba(255, 255, 255, 0.4)",
                      } as React.CSSProperties
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-6 w-6"
                    >
                      <path d="M4.5 5.653c0-1.427 1.529-2.33 2.782-1.643l10.42 5.597c1.296.695 1.296 2.59 0 3.285L7.282 18.49C6.03 19.177 4.5 18.274 4.5 16.847V5.653z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <p
              className="mt-3 text-center text-sm"
              style={{ color: "var(--secondary-60)" }}
            >
              Click to play • YouTube
            </p>
          </div>
        </div>
      </div>

      <VideoModal
        open={open}
        onClose={() => setOpen(false)}
        videoId={parsedId}
        title="Learn.ai demo video"
      />
    </section>
  );
}
