"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast, type ToastTone } from "./toast";

/** URL params that carry a one-shot flash message, mapped to a toast tone. */
const FLASH_PARAMS: { key: string; tone: ToastTone }[] = [
  { key: "error", tone: "danger" },
  { key: "ok", tone: "success" },
  { key: "success", tone: "success" },
];

/**
 * Surfaces server-action feedback that arrives as a URL param — e.g. a member
 * action that `redirect()`s to `?error=…` on failure — as a toast, then strips
 * the param so it never re-fires on refresh/back. Mount once per surface, inside
 * <ToastProvider>. Without this most of those redirect-based messages are
 * invisible (only a couple of pages render them inline today).
 */
export function FlashToaster() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  // Guards against StrictMode's double-invoke and re-renders that happen before
  // the URL is stripped; reset on the empty render so an identical repeat error
  // still toasts the next time around.
  const lastSignature = useRef("");

  useEffect(() => {
    const hits = FLASH_PARAMS.flatMap(({ key, tone }) => {
      const message = params.get(key)?.trim();
      return message ? [{ key, tone, message }] : [];
    });

    if (hits.length === 0) {
      lastSignature.current = "";
      return;
    }

    const signature = hits.map((hit) => `${hit.key}=${hit.message}`).join("&");
    if (lastSignature.current === signature) return;
    lastSignature.current = signature;

    for (const hit of hits) {
      toast.show(hit.message, { tone: hit.tone });
    }

    // Drop the consumed params, preserve the rest (e.g. ?date, ?q, ?tab).
    const next = new URLSearchParams(params.toString());
    for (const { key } of FLASH_PARAMS) next.delete(key);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [params, pathname, router, toast]);

  return null;
}
