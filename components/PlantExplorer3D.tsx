"use client";

import type { ReactNode } from "react";
import type { LeafGroupId } from "@/lib/deficiency";
import { PlantScene, type PlantStage } from "./PlantScene";
import { Scene3DIsland } from "./Scene3DIsland";

/** three.js, the plant and the gestures in one chunk; only `PlantExplorer` (below) imports it, lazily. */
export function PlantExplorer3D({
  label,
  fallback,
  selected,
  onSelect,
  stage,
}: {
  label: string;
  fallback: ReactNode;
  selected: LeafGroupId;
  onSelect: (id: Exclude<LeafGroupId, "unplaced">) => void;
  stage?: PlantStage;
}) {
  return (
    <Scene3DIsland label={label} fallback={fallback}>
      {(animate) => <PlantScene animate={animate} selected={selected} onSelect={onSelect} stage={stage} />}
    </Scene3DIsland>
  );
}
