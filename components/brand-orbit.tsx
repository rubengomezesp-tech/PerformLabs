"use client";

import { Float } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

function AppPlane({ position, rotation, scale = 1 }: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: number;
}) {
  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <boxGeometry args={[1.05, 1.8, 0.055]} />
      <meshStandardMaterial color="#071019" metalness={0.7} roughness={0.22} />
    </mesh>
  );
}

function CoreMark() {
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
            <meshStandardMaterial color="#078df2" emissive="#078df2" emissiveIntensity={0.34} metalness={0.45} roughness={0.16} />
          </mesh>
        </group>
      </Float>
      <AppPlane position={[-2.2, -0.35, -0.9]} rotation={[0.18, 0.45, 0.18]} scale={0.9} />
      <AppPlane position={[2.15, -0.1, -0.75]} rotation={[0.08, -0.48, -0.12]} scale={0.95} />
      <AppPlane position={[1.25, 1.34, -1.05]} rotation={[0.16, -0.36, -0.2]} scale={0.62} />
    </group>
  );
}

export function BrandOrbit() {
  return (
    <div className="brandOrbit" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 6.2], fov: 38 }} dpr={[1, 1.45]}>
        <ambientLight intensity={1.1} />
        <pointLight position={[2.8, 3.2, 3.4]} intensity={13} color="#078df2" />
        <pointLight position={[-3, -1.5, 2.5]} intensity={4} color="#f5f7fb" />
        <CoreMark />
      </Canvas>
    </div>
  );
}
