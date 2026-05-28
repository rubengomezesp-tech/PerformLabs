import Link from "next/link";
import type { ReactNode } from "react";

export type AttentionSeverity = "high" | "medium" | "low";

export type AttentionItem = {
  id: string;
  title: string;
  detail: string;
  area: string;
  href: string;
  severity: AttentionSeverity;
};

const SEVERITY_LABELS: Record<AttentionSeverity, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

export type AttentionQueueProps = {
  items: AttentionItem[];
  /** Rendered when the queue is empty. */
  empty?: ReactNode;
};

/**
 * Prioritised "resolve first" queue for the coach console. Renders the
 * severity-coded .coachAttentionItem rows, or an empty state when clear.
 */
export function AttentionQueue({ items, empty = null }: AttentionQueueProps) {
  if (!items.length) {
    return <>{empty}</>;
  }

  return (
    <div className="coachAttentionList">
      {items.map((item) => (
        <Link className={`coachAttentionItem ${item.severity}`} href={item.href} key={item.id}>
          <span>
            <strong>{item.title}</strong>
            <p>{item.detail}</p>
          </span>
          <small>{item.area}</small>
          <em>{SEVERITY_LABELS[item.severity]}</em>
        </Link>
      ))}
    </div>
  );
}
