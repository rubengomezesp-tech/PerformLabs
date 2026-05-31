"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Lightweight "live" updates for the member↔coach chat.
 *
 * We poll instead of opening a Supabase Realtime socket: the member's JWT lives
 * in an httpOnly cookie that JS can't read, so a browser client can't trivially
 * authenticate Realtime without us shipping a token to the client. `router.refresh()`
 * re-runs the server component (a service-role read already scoped + RLS-safe),
 * so new coach replies appear without leaking any key or widening the auth surface.
 *
 * Polling pauses while the tab is hidden and resumes (refreshing immediately) on
 * focus, so it feels live without burning requests in the background.
 */
export function ChatLive({ intervalMs = 5000 }: { intervalMs?: number }) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const start = () => {
      if (timer.current) return;
      timer.current = setInterval(() => {
        router.refresh();
      }, intervalMs);
    };
    const stop = () => {
      if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
        start();
      } else {
        stop();
      }
    };

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router, intervalMs]);

  return null;
}
