"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export function SubmitButton({
  children,
  className = "btn primary",
  pendingLabel = "Guardando…",
  name,
  value,
  formNoValidate,
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
  name?: string;
  value?: string;
  formNoValidate?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      className={className}
      type="submit"
      disabled={pending}
      aria-busy={pending}
      name={name}
      value={value}
      formNoValidate={formNoValidate}
    >
      {pending ? (
        <>
          <Loader2 size={16} className="spinIcon" /> {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
