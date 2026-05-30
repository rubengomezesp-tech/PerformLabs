"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Accessibility wiring shared by every modal surface (Dialog, member drawer):
 * - Escape closes.
 * - Tab/Shift+Tab is trapped inside the panel (WCAG 2.4.3 / 2.1.2).
 * - Focus moves into the panel on open and returns to the trigger on close.
 *
 * The panel element should have `tabIndex={-1}` so it can receive focus when it
 * contains no focusable children yet.
 */
export function useModalA11y({
  open,
  onClose,
  panelRef,
  triggerRef,
}: {
  open: boolean;
  onClose: () => void;
  panelRef: RefObject<HTMLElement | null>;
  triggerRef?: RefObject<HTMLElement | null>;
}) {
  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    const restoreTo = (triggerRef?.current ?? (document.activeElement as HTMLElement | null)) ?? null;

    const focusables = () =>
      panel
        ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null)
        : [];

    // Move focus into the dialog on open.
    (focusables()[0] ?? panel)?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const items = focusables();
      if (!items.length) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      // Return focus to the trigger when the modal closes.
      restoreTo?.focus?.();
    };
  }, [open, onClose, panelRef, triggerRef]);
}
