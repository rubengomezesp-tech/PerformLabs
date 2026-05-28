import type { ReactNode } from "react";
import { cx } from "./cx";
import { AnimatedNumber } from "./animated-number";

export type StatProps = {
  label: ReactNode;
  /** Numeric value enables a count-up animation; strings render as-is. */
  value: ReactNode;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
};

/** Canonical metric/stat primitive (label + emphasised value). */
export function Stat({ label, value, decimals, prefix, suffix, className }: StatProps) {
  return (
    <div className={cx("metric", className)}>
      {label}
      <strong>
        {typeof value === "number" ? (
          <AnimatedNumber value={value} decimals={decimals} prefix={prefix} suffix={suffix} />
        ) : (
          value
        )}
      </strong>
    </div>
  );
}
