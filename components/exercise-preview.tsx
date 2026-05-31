"use client";

import { useEffect, useState } from "react";

/**
 * Platform-default "video example" for an exercise: a looping cross-fade of the
 * exercise's own demo frames (start→end positions from the base library), so every
 * exercise with images gets an accurate moving demo with zero extra content or keys.
 *
 * A real coach/platform video (when present) takes precedence in the caller; this is
 * the default tier. Honours prefers-reduced-motion (shows the first frame static)
 * and degrades to a single image, or renders nothing so the caller shows a fallback.
 */
export function ExercisePreview({
  frames,
  name,
  className,
}: {
  frames: string[];
  name: string;
  className?: string;
}) {
  const clean = frames.filter((url) => typeof url === "string" && url.trim().length > 0);
  const canAnimate = clean.length > 1;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!canAnimate) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % clean.length);
    }, 950);
    return () => window.clearInterval(id);
  }, [canAnimate, clean.length]);

  if (!clean.length) return null;

  return (
    <div
      className={["exercisePreview", className].filter(Boolean).join(" ")}
      role="img"
      aria-label={canAnimate ? `Demo animada: ${name}` : name}
    >
      {clean.map((src, frameIndex) => (
        <img
          key={src}
          src={src}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className={frameIndex === index ? "exercisePreviewFrame is-current" : "exercisePreviewFrame"}
        />
      ))}
      {canAnimate ? <span className="exercisePreviewBadge" aria-hidden="true">▶ demo</span> : null}
    </div>
  );
}
