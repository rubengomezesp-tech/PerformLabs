"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Simple, accessible modal. Renders its own trigger button and an overlay.
 * Closes on Escape, backdrop click, the close button, or when a form inside
 * it is submitted (so coach create-forms feel quick). The form's server
 * action still runs on submit — closing is optimistic.
 */
export function Dialog({
  trigger,
  triggerClassName = "btn",
  title,
  description,
  children,
}: {
  trigger: React.ReactNode;
  triggerClassName?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => setOpen(true)}>
        {trigger}
      </button>
      {open ? (
        <div className="dialogOverlay" role="dialog" aria-modal="true" aria-label={title} onMouseDown={() => setOpen(false)}>
          <div className="dialogPanel" onMouseDown={(event) => event.stopPropagation()}>
            <header className="dialogHeader">
              <div>
                <h2>{title}</h2>
                {description ? <p>{description}</p> : null}
              </div>
              <button type="button" className="dialogClose" onClick={() => setOpen(false)} aria-label="Cerrar">
                <X size={18} />
              </button>
            </header>
            <div className="dialogBody" onSubmitCapture={() => setOpen(false)}>
              {children}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
