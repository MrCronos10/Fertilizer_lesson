"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Box3, Vector3, type Group, type Mesh } from "three";
import { ZOOM, cameraDistance, clampPan, clampZoom, dragYaw, isTap, pinchZoom } from "@/lib/gestures";
import type { LeafGroupId } from "@/lib/deficiency";

/**
 * How the plant is staged. "chapter" is chapter 1's card (T-018): the plant alone, the chosen leaves glowing.
 * "page" is the explorer page (T-038, Deficiency-Landscape.dc.html): on a soil mound, with the middle leaves,
 * the chosen group in a coloured halo and the other dimmed.
 */
export type PlantStage = "chapter" | "page";

type Props = {
  animate: boolean;
  selected: LeafGroupId;
  onSelect: (id: Exclude<LeafGroupId, "unplaced">) => void;
  stage?: PlantStage;
};

/** Leaves round a stem: [angle, radius from the stem, tilt]. Purely a drawing, nothing agronomic. */
const OLD_LEAVES = [0, 120, 240].map((deg) => ({ deg, radius: 0.55 }));
const YOUNG_LEAVES = [60, 180, 300].map((deg) => ({ deg, radius: 0.3 }));
const rad = (deg: number) => (deg * Math.PI) / 180;

/**
 * A procedural plant (no glTF, no textures): a stem, three old leaves low down and
 * three young leaves at the tip. Each cluster has an oversized invisible hit area so
 * a fingertip finds it; the leaves themselves are small. Rotate by dragging, zoom by
 * pinching (or Ctrl + scroll), pan with two fingers. The page text and the DOM radios
 * beside it do everything the scene does, so none of this is the only way in.
 */
export function PlantScene({ animate, selected, onSelect, stage = "chapter" }: Props) {
  const { gl, camera, invalidate } = useThree();
  const root = useRef<Group>(null);
  const oldHit = useRef<Mesh>(null);
  const youngHit = useRef<Mesh>(null);
  const view = useRef<{ yaw: number; zoom: number; panX: number; panY: number; busy: boolean }>({
    yaw: 0.4,
    zoom: ZOOM.start,
    panX: 0,
    panY: 0,
    busy: false,
  });
  const scratch = useRef({ box: new Box3(), point: new Vector3() });

  // Redraw when the selection changes: under prefers-reduced-motion the loop is on demand.
  useEffect(() => {
    invalidate();
  }, [selected, invalidate]);

  useEffect(() => {
    const el = gl.domElement;
    const v = view.current;
    const pointers = new Map<number, { x: number; y: number }>();
    let lastDistance = 0;
    let lastMid = { x: 0, y: 0 };
    let gestureBase = v.zoom;

    const pair = () => {
      const [a, b] = [...pointers.values()] as [{ x: number; y: number }, { x: number; y: number }];
      return { distance: Math.hypot(a.x - b.x, a.y - b.y), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
    };
    const down = (e: PointerEvent) => {
      el.setPointerCapture?.(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      v.busy = true;
      if (pointers.size === 2) ({ distance: lastDistance, mid: lastMid } = pair());
    };
    const move = (e: PointerEvent) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      if (pointers.size === 1) {
        v.yaw = dragYaw(v.yaw, e.clientX - p.x);
        p.x = e.clientX;
        p.y = e.clientY;
      } else if (pointers.size === 2) {
        p.x = e.clientX;
        p.y = e.clientY;
        const now = pair();
        if (lastDistance > 0) v.zoom = pinchZoom(v.zoom, now.distance / lastDistance);
        v.panX = clampPan(v.panX + ((now.mid.x - lastMid.x) / el.clientWidth) * v.zoom);
        v.panY = clampPan(v.panY - ((now.mid.y - lastMid.y) / el.clientHeight) * v.zoom);
        lastDistance = now.distance;
        lastMid = now.mid;
      }
      invalidate();
    };
    const up = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size === 0) v.busy = false;
    };
    // Ctrl + scroll is how most desktop browsers report a trackpad pinch. Plain scroll is left to the page.
    const wheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      v.zoom = clampZoom(v.zoom * Math.exp(e.deltaY * 0.01));
      invalidate();
    };
    // Safari's own pinch event; ignored while pointer events are already tracking two fingers.
    const gestureStart = (e: Event) => {
      e.preventDefault();
      gestureBase = v.zoom;
    };
    const gestureChange = (e: Event) => {
      e.preventDefault();
      if (pointers.size >= 2) return;
      v.zoom = pinchZoom(gestureBase, (e as Event & { scale: number }).scale);
      invalidate();
    };

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("gesturestart", gestureStart);
    el.addEventListener("gesturechange", gestureChange);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("gesturestart", gestureStart);
      el.removeEventListener("gesturechange", gestureChange);
    };
  }, [gl, invalidate]);

  useFrame((state, delta) => {
    const v = view.current;
    if (animate && !v.busy) v.yaw += delta * 0.25;
    if (root.current) {
      root.current.rotation.y = v.yaw;
      root.current.position.set(v.panX, v.panY, 0);
    }
    camera.position.z = cameraDistance(v.zoom, state.size.width / state.size.height);

    // Publish where each tap target sits on screen so e2e can check size and aim at it.
    const canvas = state.gl.domElement;
    canvas.dataset.yaw = v.yaw.toFixed(3);
    canvas.dataset.zoom = v.zoom.toFixed(3);
    const { box, point } = scratch.current;
    for (const [name, mesh] of [
      ["old", oldHit.current],
      ["young", youngHit.current],
    ] as const) {
      if (!mesh) continue;
      mesh.updateWorldMatrix(true, false);
      box.setFromObject(mesh);
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const x of [box.min.x, box.max.x])
        for (const y of [box.min.y, box.max.y])
          for (const z of [box.min.z, box.max.z]) {
            point.set(x, y, z).project(camera);
            const px = ((point.x + 1) / 2) * canvas.clientWidth;
            const py = ((1 - point.y) / 2) * canvas.clientHeight;
            minX = Math.min(minX, px); maxX = Math.max(maxX, px);
            minY = Math.min(minY, py); maxY = Math.max(maxY, py);
          }
      canvas.dataset[name === "old" ? "regionOld" : "regionYoung"] = [minX, minY, maxX - minX, maxY - minY]
        .map((n) => n.toFixed(1))
        .join(",");
    }
  });

  const tap = (id: "old" | "young") => (e: TapEvent) => {
    e.stopPropagation();
    if (isTap(e.delta)) onSelect(id);
  };

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[2, 3, 4]} intensity={1.4} />
      <group ref={root}>
        {stage === "page" ? <Ground /> : null}
        <PlantModel
          selected={selected}
          highlight={stage === "page" ? "halo" : "glow"}
          middle={stage === "page"}
          oldHitRef={oldHit}
          youngHitRef={youngHit}
          onTapOld={tap("old")}
          onTapYoung={tap("young")}
        />
      </group>
    </>
  );
}

type TapEvent = { delta: number; stopPropagation: () => void };

/** The explorer page's soil (T-038): a low mound on a wider bed, where the 2.6-unit stem stands (its foot at -1.3). */
export const GROUND = { y: -1.3, mound: "#6B4A2F", bed: "#8B6239" } as const;

function Ground() {
  return (
    <group position={[0, GROUND.y, 0]}>
      <mesh scale={[1.25, 0.2, 1.25]}>
        <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={GROUND.mound} />
      </mesh>
      <mesh position={[0, -0.02, 0]}>
        <cylinderGeometry args={[2, 2.1, 0.04, 48]} />
        <meshStandardMaterial color={GROUND.bed} />
      </mesh>
    </group>
  );
}

/** The halo colours are the lesson's old- and young-leaf colours (the artboard's #B5541E and #8456B0). */
export const HALO = { old: "#B5541E", young: "#8456B0" } as const;
const MIDDLE_LEAVES = [30, 210].map((deg) => ({ deg, radius: 0.42 }));

/** The deficiency explorer's colours; the home hero passes the redesign's own (Main.dc.html). */
export const PLANT_COLORS = { stem: "#5b7f3a", old: "#2f6f3c", young: "#8ac45a" } as const;
export type PlantColors = { readonly stem: string; readonly old: string; readonly young: string };

/**
 * The plant itself, shared by the deficiency explorer and the home hero (T-027), so the site has
 * one plant, not two. A 2.6-unit stem centred on the origin, three old leaves low down, three
 * young ones at the tip. Hit areas exist only where a caller can act on a tap.
 */
export function PlantModel({
  colors = PLANT_COLORS,
  selected = "unplaced",
  highlight = "glow",
  middle = false,
  oldHitRef,
  youngHitRef,
  onTapOld,
  onTapYoung,
}: {
  colors?: PlantColors;
  selected?: LeafGroupId;
  /** "glow" lights the chosen leaves; "halo" rings them in their colour and dims the other group. */
  highlight?: "glow" | "halo";
  /** The explorer page's two middle leaves, which belong to neither group. */
  middle?: boolean;
  oldHitRef?: React.RefObject<Mesh | null>;
  youngHitRef?: React.RefObject<Mesh | null>;
  onTapOld?: (e: TapEvent) => void;
  onTapYoung?: (e: TapEvent) => void;
}) {
  return (
    <>
      <mesh>
        <cylinderGeometry args={[0.06, 0.08, 2.6, 12]} />
        <meshStandardMaterial color={colors.stem} />
      </mesh>
      <Cluster
        y={-0.7}
        leaves={OLD_LEAVES}
        size={[0.5, 0.06, 0.2]}
        tilt={-0.25}
        color={colors.old}
        selected={selected === "old"}
        highlight={highlight}
        halo={HALO.old}
        haloSize={[0.95, 0.42, 0.95]}
        dimmed={highlight === "halo" && selected === "young"}
        hitRadius={1.15}
        hitRef={oldHitRef}
        onTap={onTapOld}
      />
      <Cluster
        y={0.95}
        leaves={YOUNG_LEAVES}
        size={[0.32, 0.05, 0.13]}
        tilt={0.5}
        color={colors.young}
        selected={selected === "young"}
        highlight={highlight}
        halo={HALO.young}
        haloSize={[0.62, 0.42, 0.62]}
        dimmed={highlight === "halo" && selected === "old"}
        hitRadius={0.75}
        hitRef={youngHitRef}
        onTap={onTapYoung}
      />
      {middle ? (
        <Cluster y={0.15} leaves={MIDDLE_LEAVES} size={[0.42, 0.055, 0.17]} tilt={0.1} color={colors.old} selected={false} hitRadius={0} />
      ) : null}
    </>
  );
}

function Cluster({
  y,
  leaves,
  size,
  tilt,
  color,
  selected,
  highlight = "glow",
  halo,
  haloSize = [1, 0.5, 1],
  dimmed = false,
  hitRadius,
  hitRef,
  onTap,
}: {
  y: number;
  leaves: readonly { deg: number; radius: number }[];
  size: readonly [number, number, number];
  tilt: number;
  color: string;
  selected: boolean;
  highlight?: "glow" | "halo";
  halo?: string;
  /** The halo's radii, close round the leaves as the artboard draws it. */
  haloSize?: readonly [number, number, number];
  dimmed?: boolean;
  hitRadius: number;
  hitRef?: React.RefObject<Mesh | null>;
  onTap?: (e: TapEvent) => void;
}) {
  // A selected cluster is drawn bigger and lit, so the state is not carried by colour alone.
  return (
    <group position={[0, y, 0]} scale={selected ? 1.15 : 1} onClick={onTap}>
      {leaves.map(({ deg, radius }) => (
        <mesh
          key={deg}
          rotation={[0, -rad(deg), tilt]}
          position={[Math.cos(rad(deg)) * radius, 0, Math.sin(rad(deg)) * radius]}
          scale={size}
        >
          <sphereGeometry args={[1, 16, 10]} />
          <meshStandardMaterial
            color={color}
            emissive={selected && highlight === "glow" ? "#f2b632" : "#000000"}
            emissiveIntensity={0.5}
            // three.js reads `transparent` only when a material is built, so in halo mode it is set from the start
            // and only the opacity changes; flipping it later would leave the dimmed group drawn solid.
            transparent={highlight === "halo"}
            opacity={dimmed ? 0.4 : 1}
          />
        </mesh>
      ))}
      {selected && highlight === "halo" && halo ? (
        <mesh scale={haloSize} renderOrder={-1}>
          <sphereGeometry args={[1, 24, 16]} />
          <meshBasicMaterial color={halo} transparent opacity={0.22} depthWrite={false} />
        </mesh>
      ) : null}
      {/* Oversized and invisible: the target a fingertip finds, far over 44 pt. */}
      {hitRef ? (
        <mesh ref={hitRef}>
          <sphereGeometry args={[hitRadius, 16, 12]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  );
}
