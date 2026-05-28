"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useId, useRef, type ReactNode } from "react";

export type ProgressRingProps = {
  /** 0–100. */
  value: number;
  label: ReactNode;
  sublabel?: ReactNode;
  /** Center display (defaults to `${value}%`). Pass a string for non-% rings. */
  display?: ReactNode;
  size?: number;
  stroke?: number;
  tone?: "accent" | "success" | "warning" | "danger";
};

const TONE_VAR: Record<NonNullable<ProgressRingProps["tone"]>, string> = {
  accent: "var(--accent)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
};

/**
 * Whoop-style animated progress ring. Sweeps to `value` once in view and
 * respects reduced-motion. The stroke is a gradient of the themeable token,
 * so white-label brand colors drive it automatically.
 */
export function ProgressRing({
  value,
  label,
  sublabel,
  display,
  size = 120,
  stroke = 10,
  tone = "accent",
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const gradientId = useId();
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();
  const offset = circumference * (1 - clamped / 100);
  const color = TONE_VAR[tone];

  return (
    <div className="progressRing">
      <svg ref={ref} width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={typeof label === "string" ? `${label}: ${clamped}%` : undefined}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="color-mix(in srgb, var(--accent) 50%, #9fd6ff)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="color-mix(in srgb, var(--text) 12%, transparent)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: reduceMotion || inView ? offset : circumference }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          className="progressRingValue"
          fill="var(--text)"
        >
          {display ?? `${Math.round(clamped)}%`}
        </text>
      </svg>
      <div className="progressRingMeta">
        <strong>{label}</strong>
        {sublabel ? <small>{sublabel}</small> : null}
      </div>
    </div>
  );
}
