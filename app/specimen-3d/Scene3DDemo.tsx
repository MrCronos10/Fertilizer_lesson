"use client";

import { DemoScene } from "@/components/DemoScene";
import { Scene3D } from "@/components/Scene3D";

export function Scene3DDemo() {
  return (
    <Scene3D
      label="Rotating green solid"
      fallback={<p className="scene3d-fallback">Static fallback: a green solid with twenty faces.</p>}
    >
      {(animate) => <DemoScene animate={animate} />}
    </Scene3D>
  );
}
