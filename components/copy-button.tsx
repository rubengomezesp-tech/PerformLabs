"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({ text, className = "btn", label = "Copiar" }: { text: string; className?: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" className={className} onClick={handleCopy} aria-live="polite">
      {copied ? <><Check size={15} /> Copiado</> : <><Copy size={15} /> {label}</>}
    </button>
  );
}
