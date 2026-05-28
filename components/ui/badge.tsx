import type { ComponentProps } from "react";
import { cx } from "./cx";

export type BadgeTone = "accent" | "success" | "danger" | "info" | "warning" | "neutral";

export type BadgeProps = Omit<ComponentProps<"span">, "className"> & {
  tone?: BadgeTone;
  className?: string;
};

/** Canonical pill/tag primitive. Tone maps to .tag tone modifiers in globals.css. */
export function Badge({ tone = "accent", className, children, ...rest }: BadgeProps) {
  return (
    <span className={cx("tag", tone !== "accent" ? tone : null, className)} {...rest}>
      {children}
    </span>
  );
}
