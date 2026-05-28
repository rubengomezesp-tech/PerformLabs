"use client";

import { Float } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { cx } from "./cx";

const FALLBACK_ACCENT = "#078df2";

function resolveAccent(node: HTMLElement | null): string {
  if (!node) return FALLBACK_ACCENT;
  const value = getComputedStyle(node).getPropertyValue("--accent").trim();
  return value || FALLBACK_ACCENT;
}

function CoreMark({ accent }: { accent: string }) {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.18;
    group.current.rotation.z = Math.sin(Date.now() * 0.0007) * 0.045;
  });

  return (
    <group ref={group}>
      <Float speed={1.35} rotationIntensity={0.32} floatIntensity={0.58}>
        <group position={[0, 0.15, 0]} rotation={[0.2, -0.35, -0.18]}>
          <mesh position={[-0.18, 0.55, 0]}>
            <boxGeometry args={[1.75, 0.18, 0.18]} />
            <meshStandardMaterial color="#f5f7fb" metalness={0.86} roughness={0.18} />
          </mesh>
          <mesh position={[-0.52, -0.14, 0]} rotation={[0, 0, -0.9]}>
            <boxGeometry args={[1.52, 0.18, 0.18]} />
            <meshStandardMaterial color="#f5f7fb" metalness={0.86} roughness={0.18} />
          </mesh>
          <mesh position={[0.5, -0.32, 0.06]} rotation={[0, 0, -0.08]}>
            <boxGeometry args={[0.64, 0.24, 0.2]} />
            <meshStandardMaterial
              color={accent}
              emissive={accent}
              emissiveIntensity={0.34}
              metalness={0.45}
              roughness={0.16}
            />
          </mesh>
        </group>
      </Float>
    </group>
  );
}

export type SceneOrbitProps = {
  className?: string;
  /** Override the accent color; defaults to the inherited --accent token. */
  accent?: string;
};

/**
 * Themeable floating 3D mark. Reads the live --accent token so the white-label
 * brand color drives the lighting and emissive geometry.
 */
export function SceneOrbit({ className, accent }: SceneOrbitProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [resolved, setResolved] = useState(accent ?? FALLBACK_ACCENT);

  useEffect(() => {
    if (accent) {
      setResolved(accent);
      return;
    }
    setResolved(resolveAccent(wrapRef.current));
  }, [accent]);

  return (
    <div ref={wrapRef} className={cx("brandOrbit", className)} aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 6.2], fov: 38 }} dpr={[1, 1.45]}>
        <ambientLight intensity={1.1} />
        <pointLight position={[2.8, 3.2, 3.4]} intensity={13} color={resolved} />
        <pointLight position={[-3, -1.5, 2.5]} intensity={4} color="#f5f7fb" />
        <CoreMark accent={resolved} />
      </Canvas>
    </div>
  );
}
