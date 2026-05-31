"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Polls the coach inbox so new member messages surface without a manual reload.
 * Same rationale as the member side: a service-role server read re-runs on
 * refresh, no Realtime socket or client token needed. Pauses on a hidden tab.
 */
export function InboxLive({ intervalMs = 6000 }: { intervalMs?: number }) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const start = () => {
      if (timer.current) return;
      timer.current = setInterval(() => router.refresh(), intervalMs);
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
