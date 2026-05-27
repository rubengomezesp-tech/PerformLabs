import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <article className="card span12 emptyState">
      <Icon color="var(--gold)" />
      <h2>{title}</h2>
      <p>{text}</p>
      {action}
    </article>
  );
}
