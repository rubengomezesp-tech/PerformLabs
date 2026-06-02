"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * In-session exercises as a horizontal, swipeable carousel — one exercise per
 * screen, the MacroActive-style flow, so logging a workout is a swipe across
 * exercises instead of one long vertical scroll. The slides (with all their set
 * inputs) are passed as children from the server page and rendered in place, so
 * they stay inside the session <form>: this is presentational only and never
 * touches the save/issue server actions. Buttons are type="button" so they never
 * submit the form, and motion respects prefers-reduced-motion.
 */
export function WorkoutSessionCarousel({
  count,
  children,
  labelPrefix = "Ejercicio",
}: {
  count: number;
  children: React.ReactNode;
  labelPrefix?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Track the centered slide from the real scroll position (deterministic on
  // both phones, where a slide fills the track, and desktop, where the next one
  // peeks) so the counter, dots and prev/next stay in sync with manual swipes.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    const sync = () => {
      const slides = Array.from(track.querySelectorAll<HTMLElement>("[data-slide]"));
      if (!slides.length) return;
      const center = track.scrollLeft + track.clientWidth / 2;
      let best = 0;
      let bestDist = Number.POSITIVE_INFINITY;
      slides.forEach((slide, index) => {
        const slideCenter = slide.offsetLeft - track.offsetLeft + slide.clientWidth / 2;
        const dist = Math.abs(slideCenter - center);
        if (dist < bestDist) {
          bestDist = dist;
          best = index;
        }
      });
      setActive(best);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(sync);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    sync();
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [count]);

  const goTo = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const slides = track.querySelectorAll<HTMLElement>("[data-slide]");
    const clamped = Math.max(0, Math.min(slides.length - 1, index));
    const target = slides[clamped];
    if (!target) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const left = target.offsetLeft - track.offsetLeft - Math.max(0, (track.clientWidth - target.clientWidth) / 2);
    track.scrollTo({ left, behavior: reduce ? "auto" : "smooth" });
  }, []);

  const atStart = active <= 0;
  const atEnd = active >= count - 1;

  return (
    <div className="sessionCarousel" role="group" aria-roledescription="carrusel" aria-label="Ejercicios de la sesión">
      <div className="sessionCarouselBar">
        <span className="sessionCarouselCount" role="status" aria-live="polite">
          {labelPrefix} <strong>{Math.min(active + 1, count)}</strong> de {count}
        </span>
        <div className="sessionCarouselDots" aria-hidden="true">
          {Array.from({ length: count }).map((_, index) => (
            <span key={index} className={index === active ? "isActive" : undefined} />
          ))}
        </div>
        <div className="sessionCarouselNav">
          <button type="button" onClick={() => goTo(active - 1)} disabled={atStart} aria-label="Ejercicio anterior">
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => goTo(active + 1)} disabled={atEnd} aria-label="Ejercicio siguiente">
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="sessionCarouselTrack" ref={trackRef} tabIndex={0} aria-label="Desliza horizontalmente para ver cada ejercicio">
        {children}
      </div>
    </div>
  );
}
