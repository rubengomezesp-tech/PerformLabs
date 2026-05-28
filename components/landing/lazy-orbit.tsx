"use client";

import dynamic from "next/dynamic";

/**
 * Defers the WebGL/three.js bundle into its own client-only chunk so it never
 * blocks the landing's initial paint or time-to-interactive.
 */
const SceneOrbit = dynamic(
  () => import("@/components/ui/scene-orbit").then((mod) => mod.SceneOrbit),
  { ssr: false, loading: () => null },
);

export function LazyOrbit({ className }: { className?: string }) {
  return <SceneOrbit className={className} />;
}
