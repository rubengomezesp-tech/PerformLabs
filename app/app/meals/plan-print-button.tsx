"use client";

import { Printer } from "lucide-react";

/**
 * Triggers the browser print dialog for the print-optimized plan view. Used on the
 * /app/meals/print one-pager (a @media print stylesheet hides chrome and lays the
 * plan out as a clean branded sheet — no PDF dependency). `variant="link"` styles it
 * as a topbar button on the meals page that just deep-links to the print view.
 */
export function PlanPrintButton({ label = "Imprimir / PDF" }: { label?: string }) {
  return (
    <button className="btn primary planPrintTrigger" type="button" onClick={() => window.print()}>
      <Printer size={16} /> {label}
    </button>
  );
}
