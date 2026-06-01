import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "@/components/ui/cx";

/**
 * Canonical empty state for the member app: a single premium pattern (accent icon
 * chip + title + text + optional CTA/extra content) replacing the scattered
 * `inlineEmpty` variants. Mirrors the member glass language; the console/coach
 * surfaces keep their flatter <EmptyState> primitive.
 */
export function MemberEmpty({
  icon: Icon,
  title,
  text,
  action,
  children,
  className,
}: {
  icon: LucideIcon;
  title: ReactNode;
  text?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <article className={cx("card span12 memberEmpty uiGlass uiSheen", className)}>
      <span className="uiIconChip memberEmptyIcon" aria-hidden="true">
        <Icon size={24} />
      </span>
      <div className="memberEmptyBody">
        <strong>{title}</strong>
        {text ? <p>{text}</p> : null}
        {children}
        {action ? <div className="memberEmptyActions">{action}</div> : null}
      </div>
    </article>
  );
}
