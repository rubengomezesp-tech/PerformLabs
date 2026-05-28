"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

export type ToastTone = "info" | "success" | "danger" | "warning";

export type ToastOptions = {
  tone?: ToastTone;
  /** Auto-dismiss delay in ms (default 4000). Pass 0 to keep it sticky. */
  duration?: number;
};

type ToastItem = {
  id: string;
  message: ReactNode;
  tone: ToastTone;
};

type ToastApi = {
  show: (message: ReactNode, options?: ToastOptions) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

/** Imperative toast API. Must be used within <ToastProvider>. */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const show = useCallback<ToastApi["show"]>(
    (message, options) => {
      const id = `toast-${(counter.current += 1)}`;
      const tone = options?.tone ?? "info";
      const duration = options?.duration ?? 4000;
      setItems((current) => [...current, { id, message, tone }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Toaster items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function Toaster({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: string) => void }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="toastViewport" role="region" aria-label="Notificaciones" aria-live="polite">
      <AnimatePresence initial={!reduceMotion}>
        {items.map((item) => (
          <motion.button
            key={item.id}
            type="button"
            className={`toast ${item.tone}`}
            onClick={() => onDismiss(item.id)}
            layout={!reduceMotion}
            initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            {item.message}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
