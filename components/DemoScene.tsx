"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";

/**
 * Procedural placeholder for the 3D foundation (T-017): no glTF, no textures. The
 * angle is mirrored to the canvas so e2e can tell whether idle animation is running.
 */
export function DemoScene({ animate }: { animate: boolean }) {
  const mesh = useRef<Mesh>(null);
  useFrame((state, delta) => {
    if (!mesh.current) return;
    if (animate) mesh.current.rotation.y += delta;
    state.gl.domElement.dataset.angle = mesh.current.rotation.y.toFixed(3);
  });
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 3, 4]} intensity={1.5} />
      <mesh ref={mesh}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#3a7d44" flatShading />
      </mesh>
    </>
  );
}
