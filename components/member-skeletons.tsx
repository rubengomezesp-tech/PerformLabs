import type { CSSProperties } from "react";
import { Skeleton } from "@/components/ui";

/**
 * Loading placeholders for the member app, shaped to mirror the real views so the
 * route-level skeletons feel like the page is materialising (not a generic spinner).
 *
 * Pure decorative markup: the .skeleton shimmer is globally disabled under
 * prefers-reduced-motion, and the Skeleton primitive sets aria-hidden — the route's
 * <Topbar> carries the loading context for screen readers. Self-contained inline
 * styles keep this out of the (already large) global stylesheet.
 */

type Span = 4 | 6 | 12;

const lines: CSSProperties = { display: "grid", gap: 10, minWidth: 0 };
const rowMain: CSSProperties = { display: "flex", alignItems: "center", gap: 12, minWidth: 0 };

function spanClass(span: Span) {
  return `card span${span} uiSheen`;
}

/** Whoop-style ring row + side labels (meals / diary macro summary). */
export function RingsSkeleton({ span = 12, rings = 3 }: { span?: Span; rings?: number }) {
  return (
    <article className={spanClass(span)} aria-hidden="true">
      <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 14 }}>
          {Array.from({ length: rings }).map((_, i) => (
            <Skeleton key={i} width={88} height={88} circle />
          ))}
        </div>
        <div style={{ ...lines, flex: 1, minWidth: 160 }}>
          <Skeleton width="58%" height={16} />
          <Skeleton width="40%" height={12} />
          <Skeleton width="74%" height={12} />
        </div>
      </div>
    </article>
  );
}

/** Row of compact metric tiles (progress metrics / workout status). */
export function StatTilesSkeleton({ count = 3, span = 4 }: { count?: number; span?: Span }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <article className={spanClass(span)} aria-hidden="true" key={i}>
          <span className="skeleton skeletonIcon" />
          <div style={{ ...lines, marginTop: 12 }}>
            <Skeleton width="50%" height={22} />
            <Skeleton width="70%" height={12} />
          </div>
        </article>
      ))}
    </>
  );
}

/** Card with a header line and stacked rows (meal list, sessions, entries). */
export function ListSkeleton({ rows = 4, span = 12 }: { rows?: number; span?: Span }) {
  return (
    <article className={spanClass(span)} aria-hidden="true">
      <Skeleton width="34%" height={16} />
      <div className="list" style={{ marginTop: 14 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div className="row" key={i}>
            <span style={rowMain}>
              <span className="skeleton skeletonIcon" style={{ width: 34, height: 34 }} />
              <span style={lines}>
                <Skeleton width={140} height={13} />
                <Skeleton width={90} height={11} />
              </span>
            </span>
            <Skeleton width={56} height={26} />
          </div>
        ))}
      </div>
    </article>
  );
}

/** Wide block placeholder (charts, evolution graphs, active session). */
export function WideBlockSkeleton({ height = 220, span = 12 }: { height?: number; span?: Span }) {
  return (
    <article className={spanClass(span)} aria-hidden="true">
      <Skeleton width="30%" height={16} />
      <div style={{ marginTop: 14 }}>
        <Skeleton width="100%" height={height} />
      </div>
    </article>
  );
}

/** Grid of media cards (recipes): image block + two text lines each. */
export function CardGridSkeleton({ count = 6, span = 4 }: { count?: number; span?: Span }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <article className={spanClass(span)} aria-hidden="true" key={i}>
          <Skeleton width="100%" height={140} />
          <div style={{ ...lines, marginTop: 12 }}>
            <Skeleton width="70%" height={14} />
            <Skeleton width="45%" height={11} />
          </div>
        </article>
      ))}
    </>
  );
}
