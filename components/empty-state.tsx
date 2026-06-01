import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui";

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
    <Card span={12} className="emptyState">
      <Icon color="var(--accent)" aria-hidden="true" />
      <h2>{title}</h2>
      <p>{text}</p>
      {action}
    </Card>
  );
}
