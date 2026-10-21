"use client";

import type { ReactNode } from "react";
import type { LeafGroupId } from "@/lib/deficiency";
import { PlantScene } from "./PlantScene";
import { Scene3DIsland } from "./Scene3DIsland";

/** three.js, the plant and the gestures in one chunk; only `PlantExplorer` (below) imports it, lazily. */
export function PlantExplorer3D({
  label,
  fallback,
  selected,
  onSelect,
}: {
  label: string;
  fallback: ReactNode;
  selected: LeafGroupId;
  onSelect: (id: Exclude<LeafGroupId, "unplaced">) => void;
}) {
  return (
    <Scene3DIsland label={label} fallback={fallback}>
      {(animate) => <PlantScene animate={animate} selected={selected} onSelect={onSelect} />}
    </Scene3DIsland>
  );
}
