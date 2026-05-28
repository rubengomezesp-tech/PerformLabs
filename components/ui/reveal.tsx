"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

export type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Animation entry direction. */
  from?: Direction;
  /** Stagger helper — multiplied by 0.08s. */
  index?: number;
  delay?: number;
  id?: string;
};

const OFFSET: Record<Direction, { x?: number; y?: number }> = {
  up: { y: 28 },
  down: { y: -28 },
  left: { x: 28 },
  right: { x: -28 },
  none: {},
};

/**
 * Scroll-triggered reveal built on framer-motion. Falls back to a plain
 * container when the user prefers reduced motion.
 */
export function Reveal({ children, className, from = "up", index = 0, delay = 0, id }: RevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div className={className} id={id}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      id={id}
      initial={{ opacity: 0, filter: "blur(8px)", ...OFFSET[from] }}
      whileInView={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: delay + index * 0.08 }}
    >
      {children}
    </motion.div>
  );
}
