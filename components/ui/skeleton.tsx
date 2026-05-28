import { cx } from "./cx";

export type SkeletonProps = {
  /** CSS width (e.g. "60%", 120). */
  width?: string | number;
  /** CSS height (e.g. 16, "1.2em"). */
  height?: string | number;
  /** Pill shape for avatars/icons. */
  circle?: boolean;
  className?: string;
};

/** Single shimmer placeholder built on the .skeleton styles. */
export function Skeleton({ width, height, circle, className }: SkeletonProps) {
  return (
    <span
      className={cx("skeleton", circle && "skeletonCircle", className)}
      style={{ width, height, borderRadius: circle ? "999px" : undefined }}
      aria-hidden="true"
    />
  );
}

/** Stacked text lines for list/paragraph loading states. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <span className={cx("skeletonText", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <span className="skeleton skeletonLine" key={index} />
      ))}
    </span>
  );
}
