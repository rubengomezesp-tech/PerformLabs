import type { ComponentType, ReactNode } from "react";
import { cx } from "./cx";

export type SignalTone = "neutral" | "good" | "warning" | "danger";

export type SignalCardProps = {
  label: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
  tone?: SignalTone;
  icon?: ComponentType<{ size?: number }>;
  /** 12-column grid span (defaults to 3). */
  span?: 3 | 4 | 6 | 12;
  className?: string;
};

/**
 * Tone-coded metric card used across the coach console (dashboard, analytics).
 * Wraps the .coachSignal styles so signals stay visually consistent.
 */
export function SignalCard({ label, value, detail, tone = "neutral", icon: Icon, span = 3, className }: SignalCardProps) {
  return (
    <article className={cx("card", `span${span}`, "motionCard coachSignal", tone !== "neutral" ? tone : null, className)}>
      {Icon ? (
        <div className="coachSignalIcon">
          <Icon size={18} />
        </div>
      ) : null}
      <span className="metric">
        {label}
        <strong>{value}</strong>
      </span>
      {detail ? <p>{detail}</p> : null}
    </article>
  );
}
