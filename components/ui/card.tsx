import type { ComponentProps } from "react";
import { cx } from "./cx";

type Span = 3 | 4 | 5 | 6 | 7 | 8 | 12;

export type CardProps = Omit<ComponentProps<"article">, "className"> & {
  /** 12-column grid span (adds .span{n}). */
  span?: Span;
  /** Adds the interactive hover treatment (elevation + accent border). */
  interactive?: boolean;
  className?: string;
};

/**
 * Canonical surface primitive. Wraps the .card class with optional grid span
 * and the interactive hover state from globals.css.
 */
export function Card({ span, interactive, className, children, ...rest }: CardProps) {
  return (
    <article
      className={cx("card", span ? `span${span}` : null, interactive && "interactive", className)}
      {...rest}
    >
      {children}
    </article>
  );
}
