"use client";

import { useEffect, useRef } from "react";

/**
 * Keeps the chat thread pinned to the latest message. Re-scrolls whenever the
 * message count changes (a new bubble arrived via send or poll), mirroring how a
 * real messenger snaps to the bottom.
 */
export function ChatScroll({ count }: { count: number }) {
  const anchor = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    anchor.current?.scrollIntoView({ block: "end" });
  }, [count]);
  return <div ref={anchor} aria-hidden />;
}
