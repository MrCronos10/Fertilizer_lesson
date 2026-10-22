"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  BufferGeometry,
  Color,
  CubicBezierCurve3,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Shape,
  ShapeGeometry,
  TubeGeometry,
  Vector3,
  type Group,
  type Mesh,
  type PerspectiveCamera,
} from "three";
import { dragYaw } from "@/lib/gestures";
import { ELEMENTS, type Element } from "@/lib/home";
import {
  FOV_DEG,
  PARTICLE_RANGE,
  REST_YAW,
  cameraDistance,
  easeYaw,
  gradientAt,
  particleT,
  toScene,
  type Stop,
} from "@/lib/hero-scene";
import type { Theme } from "@/lib/theme";
import { PlantModel } from "./PlantScene";
import { Scene3DIsland } from "./Scene3DIsland";
import { useTheme } from "./ThemeToggle";

/*
 * The home hero's soil-and-plant block (T-027), rebuilt from Main.dc.html and Home-Night.dc.html
 * as procedural geometry (D7): every coordinate below is the artboard's own pixel value, turned
 * into scene units by `toScene`. The plant is the deficiency explorer's (PlantModel), so the site
 * has one plant. No text is drawn here (D3): labels, leader lines and the hint are HTML.
 */

/** Scene art, not design tokens: the artboards' own values, day and night. */
const PALETTE = {
  light: {
    soil: ["#7A563A", "#5A3D27", "#3E2A1A"],
    side: "#2E2014",
    air: "#DCE7D6",
    strata: { color: "#A98563", opacity: [0.45, 0.35, 0.28] },
    pebbles: "#8B6239",
    roots: "#C9A87C",
    seam: { color: "#3E2A1A", opacity: 0.35 },
    outline: { color: "#1B2A22", opacity: 0.3 },
    shadow: { color: "#1B2A22", opacity: 0.16 },
    plant: { stem: "#2F6F3E", old: "#4C8A50", young: "#6FB169" },
    npk: { N: "#2F6F3E", P: "#8456B0", K: "#B5541E" },
    halo: 0,
  },
  dark: {
    soil: ["#3A2819", "#271A10", "#15100A"],
    side: "#120C07",
    air: "#18303B",
    strata: { color: "#6B5236", opacity: [0.5, 0.4, 0.3] },
    pebbles: null,
    roots: "#8A6B45",
    seam: { color: "#0A0704", opacity: 0.5 },
    outline: { color: "#EDEFE6", opacity: 0.35 },
    shadow: { color: "#000000", opacity: 0.3 },
    plant: { stem: "#2E6B40", old: "#2B5F3A", young: "#3D7F4C" },
    npk: { N: "#7CC68D", P: "#C4A0E8", K: "#F0A368" },
    halo: 0.22,
  },
} as const;

const FRONT = 0.3; // the cut face; the block runs back to -FRONT
const [LEFT, TOP] = toScene(700, 112);
const [RIGHT, BOTTOM] = toScene(1012, 430);
const [, GROUND] = toScene(0, 244);
const [, MID] = toScene(0, 337); // halfway down the soil: the gradient's middle stop
const RADIUS = 0.18; // rx="18"
/** The shared plant is 2.6 units tall, centred: at this size and height its old leaves sit just above the
    soil and its tip reaches the top of the block, as Main's leaves span 114–222 px. */
const PLANT_SCALE = 0.62;
const PLANT_LIFT = 0.56;

/** A cubic Bézier from an SVG "M x y C x y, x y, x y", lying on the cut face. */
function bezier(d: string, z = FRONT): CubicBezierCurve3 {
  const n = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
  const p = (i: number) => {
    const [x, y] = toScene(n[i]!, n[i + 1]!);
    return new Vector3(x, y, z);
  };
  return new CubicBezierCurve3(p(0), p(2), p(4), p(6));
}

const STRATA = ["M700 268 C 790 262, 900 276, 1012 268", "M700 320 C 800 314, 910 328, 1012 318", "M700 376 C 800 372, 910 384, 1012 374"];
/** Roots, thickest first: [path, stroke-width]. The first three carry N, P and K. */
const ROOTS = [
  ["M856 244 C 856 288, 854 330, 852 400", 5],
  ["M856 268 C 822 288, 790 316, 774 372", 3.5],
  ["M856 282 C 896 300, 926 330, 944 384", 3.5],
  ["M854 318 C 828 338, 812 360, 806 396", 2.4],
  ["M854 330 C 884 348, 900 368, 906 400", 2.4],
] as const;
const PEBBLES = [[742, 296, 4], [812, 344, 3], [930, 300, 3.5], [976, 362, 4], [762, 400, 3], [886, 408, 3.5]] as const;
/** Where the artboard drew each element's three particles: [x, y, r, opacity]. N rides root 0, P root 1, K root 2. */
const PARTICLES: Record<Element, readonly (readonly [number, number, number, number])[]> = {
  N: [[852, 372, 7, 1], [848, 320, 6, 1], [853, 282, 5, 0.8]],
  P: [[788, 352, 7, 1], [806, 310, 6, 1], [828, 276, 5, 0.8]],
  K: [[930, 366, 7, 1], [908, 318, 6, 1], [884, 278, 5, 0.8]],
};
/** Where Main.dc.html's leader lines end, one per label. */
const LEADER_ENDS: Record<Element, readonly [number, number]> = { N: [966, 276], P: [938, 318], K: [950, 368] };

function roundedRect(x0: number, y0: number, x1: number, y1: number, r: number, corners: { top: boolean; bottom: boolean }) {
  const s = new Shape();
  const rt = corners.top ? r : 0;
  const rb = corners.bottom ? r : 0;
  s.moveTo(x0 + rb, y0);
  s.lineTo(x1 - rb, y0);
  if (rb) s.quadraticCurveTo(x1, y0, x1, y0 + rb);
  s.lineTo(x1, y1 - rt);
  if (rt) s.quadraticCurveTo(x1, y1, x1 - rt, y1);
  s.lineTo(x0 + rt, y1);
  if (rt) s.quadraticCurveTo(x0, y1, x0, y1 - rt);
  s.lineTo(x0, y0 + rb);
  if (rb) s.quadraticCurveTo(x0, y0, x0 + rb, y0);
  return s;
}

const linear = (hex: string) => {
  const c = new Color(hex); // sRGB hex → the renderer's linear working space
  return [c.r, c.g, c.b] as const;
};

/**
 * Paints a vertical gradient into the vertices, so the soil's three stops land exactly where drawn.
 * A theme change rewrites the same buffer rather than attaching a new one, whose predecessor's GPU
 * buffer three.js would otherwise keep until the geometry is disposed.
 */
function paintGradient(geometry: BufferGeometry, stops: readonly Stop[]) {
  const pos = geometry.getAttribute("position");
  const colors: number[] = [];
  for (let i = 0; i < pos.count; i++) colors.push(...gradientAt(pos.getY(i), stops));
  const existing = geometry.getAttribute("color");
  if (existing) {
    (existing.array as Float32Array).set(colors);
    existing.needsUpdate = true;
  } else {
    geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  }
}

function useGeometries() {
  return useMemo(() => {
    const soilShape = roundedRect(LEFT, BOTTOM, RIGHT, GROUND, RADIUS, { top: false, bottom: true });
    const body = new ExtrudeGeometry(soilShape, { depth: 2 * FRONT, bevelEnabled: false, curveSegments: 6 });
    body.translate(0, 0, -FRONT);
    // The cut face in two bands, split at the middle stop, so each band is a straight blend.
    const upper = new ShapeGeometry(roundedRect(LEFT, MID, RIGHT, GROUND, 0, { top: false, bottom: false }));
    const lower = new ShapeGeometry(roundedRect(LEFT, BOTTOM, RIGHT, MID, RADIUS, { top: false, bottom: true }), 6);
    const air = new ExtrudeGeometry(roundedRect(LEFT, GROUND, RIGHT, TOP, RADIUS, { top: true, bottom: false }), {
      depth: 0.04,
      bevelEnabled: false,
      curveSegments: 6,
    });
    air.translate(0, 0, -FRONT);
    const outline = new BufferGeometry().setFromPoints(
      roundedRect(LEFT, BOTTOM, RIGHT, TOP, RADIUS, { top: true, bottom: true })
        .getPoints(6)
        .map((p) => new Vector3(p.x, p.y, FRONT + 0.004)),
    );
    const strata = STRATA.map((d) => {
      const tube = new TubeGeometry(bezier(d, FRONT + 0.002), 32, 0.01, 4, false);
      tube.scale(1, 1, 0.2);
      return tube;
    });
    const roots = ROOTS.map(([d, width]) => new TubeGeometry(bezier(d), 32, width / 200, 6, false));
    return { body, upper, lower, air, outline, strata, roots, rootCurves: ROOTS.map(([d]) => bezier(d)) };
  }, []);
}

/** The t on `curve` nearest the artboard point, so a resting particle sits exactly where it was drawn. */
function nearestT(curve: CubicBezierCurve3, x: number, y: number) {
  const [sx, sy] = toScene(x, y);
  let best = 0;
  let bestD = Infinity;
  const p = new Vector3();
  for (let i = 0; i <= 200; i++) {
    curve.getPoint(i / 200, p);
    const d = (p.x - sx) ** 2 + (p.y - sy) ** 2;
    if (d < bestD) [best, bestD] = [i / 200, d];
  }
  return best;
}

type Props = {
  label: string;
  fallback: React.ReactNode;
  /** The HTML overlay whose three paths join each label to the block (landscape only). */
  leadersId: string;
};

export function HeroScene3D({ label, fallback, leadersId }: Props) {
  const theme = useTheme() ?? "light";
  return (
    <Scene3DIsland label={label} fallback={fallback}>
      {(animate) => <SoilBlock animate={animate} theme={theme} leadersId={leadersId} />}
    </Scene3DIsland>
  );
}

function SoilBlock({ animate, theme, leadersId }: { animate: boolean; theme: Theme; leadersId: string }) {
  const { gl, camera, invalidate } = useThree();
  const g = useGeometries();
  const colors = PALETTE[theme];
  const root = useRef<Group>(null);
  const particles = useRef<(Mesh | null)[]>([]);
  const halos = useRef<(Mesh | null)[]>([]);
  const view = useRef({ yaw: REST_YAW, busy: false, clock: 0 });

  const soilStops = useMemo<Stop[]>(
    () => [GROUND, MID, BOTTOM].map((y, i) => ({ y, color: linear(colors.soil[i]!) })),
    [colors],
  );
  // Before paint, so the first frame already has the theme's soil.
  useLayoutEffect(() => {
    paintGradient(g.upper, soilStops);
    paintGradient(g.lower, soilStops);
    invalidate();
  }, [g, soilStops, invalidate]);

  const riders = useMemo(
    () =>
      ELEMENTS.flatMap((e, root) =>
        PARTICLES[e].map(([x, y, r, opacity]) => ({ e, curve: g.rootCurves[root]!, t0: nearestT(g.rootCurves[root]!, x, y), r: r / 100, opacity })),
      ),
    [g],
  );

  useEffect(() => () => Object.values(g).flat().forEach((x) => "dispose" in x && x.dispose()), [g]);
  useEffect(() => invalidate(), [theme, invalidate]);

  // Drag to turn; the block settles back when let go. Vertical swipes still scroll (touch-action: pan-y).
  useEffect(() => {
    const el = gl.domElement;
    const v = view.current;
    // Only the first finger turns the block: a second one would feed its own position into the same delta.
    let drag: { id: number; x: number } | null = null;
    const down = (e: PointerEvent) => {
      if (drag) return;
      el.setPointerCapture?.(e.pointerId);
      drag = { id: e.pointerId, x: e.clientX };
      v.busy = true;
    };
    const move = (e: PointerEvent) => {
      if (drag?.id !== e.pointerId) return;
      v.yaw = dragYaw(v.yaw, e.clientX - drag.x);
      drag.x = e.clientX;
      invalidate();
    };
    const up = (e: PointerEvent) => {
      if (drag?.id !== e.pointerId) return;
      drag = null;
      v.busy = false;
      invalidate();
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [gl, invalidate]);

  // The flat plate stands in until this canvas has drawn (home.css reads data-scene), so the hero is never empty.
  const drawn = useRef(false);
  useEffect(
    () => () => {
      delete document.documentElement.dataset.scene;
    },
    [],
  );

  // Off-screen, the particles and leader lines are work nobody sees: stop the loop until the block is back.
  const setFrameloop = useThree((s) => s.setFrameloop);
  useEffect(() => {
    if (!animate || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setFrameloop(entry?.isIntersecting ? "always" : "never"));
    io.observe(gl.domElement);
    return () => {
      io.disconnect();
      setFrameloop("always");
    };
  }, [animate, gl, setFrameloop]);

  const leaders = useLeaders(leadersId, gl.domElement);
  const scratch = useMemo(() => ({ p: new Vector3() }), []);

  useFrame((state, delta) => {
    // Frame the drawing to the canvas: the same scale as the artboard on the landscape box.
    const cam = state.camera as PerspectiveCamera;
    const distance = cameraDistance(state.size.width / state.size.height);
    if (cam.fov !== FOV_DEG || cam.position.z !== distance) {
      cam.fov = FOV_DEG;
      cam.position.set(0, 0, distance);
      cam.lookAt(0, 0, 0);
      cam.updateProjectionMatrix();
    }
    const v = view.current;
    if (!v.busy) {
      const settled = animate ? easeYaw(v.yaw, delta) : REST_YAW;
      if (Math.abs(settled - v.yaw) > 1e-4) invalidate();
      v.yaw = settled;
    }
    if (animate) v.clock += delta;
    root.current!.rotation.y = v.yaw;
    state.gl.domElement.dataset.yaw = v.yaw.toFixed(3);

    const [lo, hi] = PARTICLE_RANGE;
    riders.forEach((rider, i) => {
      const t = animate ? particleT(rider.t0, v.clock) : rider.t0;
      const depth = (t - lo) / (hi - lo); // 1 at the deep end
      rider.curve.getPoint(t, scratch.p);
      const scale = animate ? 0.7 + 0.3 * depth : 1;
      for (const mesh of [particles.current[i], halos.current[i]]) {
        mesh?.position.set(scratch.p.x, scratch.p.y, FRONT + 0.02);
        mesh?.scale.setScalar(rider.r * scale);
      }
    });
    root.current!.updateMatrixWorld();
    leaders.update(root.current!, camera);
    if (!drawn.current) {
      drawn.current = true;
      document.documentElement.dataset.scene = "ready";
    }
  });

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[2, 3, 4]} intensity={1.4} />
      {/* The shadow stays put while the block turns above it. */}
      <mesh position={[toScene(866, 0)[0], toScene(0, 440)[1], -0.1]} scale={[1.68, 0.16, 1]}>
        <circleGeometry args={[1, 48]} />
        <meshBasicMaterial color={colors.shadow.color} transparent opacity={colors.shadow.opacity} toneMapped={false} depthWrite={false} />
      </mesh>
      <group ref={root} rotation-y={REST_YAW}>
        <mesh geometry={g.body}>
          <meshBasicMaterial color={colors.side} toneMapped={false} />
        </mesh>
        <mesh geometry={g.air}>
          <meshBasicMaterial attach="material-0" color={colors.air} toneMapped={false} />
          <meshBasicMaterial attach="material-1" color={colors.side} toneMapped={false} />
        </mesh>
        {[g.upper, g.lower].map((face, i) => (
          <mesh key={i} geometry={face} position-z={FRONT + 0.001}>
            <meshBasicMaterial vertexColors toneMapped={false} />
          </mesh>
        ))}
        <mesh position={[(LEFT + RIGHT) / 2, GROUND, FRONT + 0.003]}>
          <planeGeometry args={[RIGHT - LEFT, 0.04]} />
          <meshBasicMaterial color={colors.seam.color} transparent opacity={colors.seam.opacity} toneMapped={false} />
        </mesh>
        {g.strata.map((tube, i) => (
          <mesh key={i} geometry={tube}>
            <meshBasicMaterial color={colors.strata.color} transparent opacity={colors.strata.opacity[i]} toneMapped={false} />
          </mesh>
        ))}
        {colors.pebbles
          ? PEBBLES.map(([x, y, r]) => (
              <mesh key={`${x}-${y}`} position={[...toScene(x, y), FRONT + 0.002]}>
                <circleGeometry args={[r / 100, 16]} />
                <meshBasicMaterial color={colors.pebbles!} transparent opacity={0.5} toneMapped={false} />
              </mesh>
            ))
          : null}
        {g.roots.map((tube, i) => (
          <mesh key={i} geometry={tube}>
            <meshBasicMaterial color={colors.roots} toneMapped={false} />
          </mesh>
        ))}
        {riders.map((rider, i) => (
          <group key={i}>
            <mesh ref={(m) => void (halos.current[i] = m)} visible={colors.halo > 0 && rider.opacity === 1 && rider.r === 0.07}>
              <circleGeometry args={[11 / 7, 24]} />
              <meshBasicMaterial color={colors.npk[rider.e]} transparent opacity={colors.halo} toneMapped={false} depthWrite={false} />
            </mesh>
            <mesh ref={(m) => void (particles.current[i] = m)}>
              <sphereGeometry args={[1, 16, 12]} />
              <meshBasicMaterial color={colors.npk[rider.e]} transparent={rider.opacity < 1} opacity={rider.opacity} toneMapped={false} />
            </mesh>
          </group>
        ))}
        <lineLoop geometry={g.outline}>
          <lineBasicMaterial color={colors.outline.color} transparent opacity={colors.outline.opacity} toneMapped={false} />
        </lineLoop>
        {/* The deficiency explorer's plant, standing on the soil above the roots. */}
        <group position={[toScene(856, 0)[0], GROUND + PLANT_LIFT, 0.15]} scale={PLANT_SCALE}>
          <PlantModel colors={colors.plant} />
        </group>
      </group>
    </>
  );
}

/**
 * Main.dc.html joins each label to the block with a line. The lines are HTML (an SVG over the
 * page), not part of the scene, so they are drawn here by projecting each end point every frame:
 * they stay on the block while it turns. Where the labels and the canvas sit is measured only
 * when something resizes, never per frame. Hidden by the stylesheet outside the landscape
 * layout, and then skipped.
 */
function useLeaders(id: string, canvas: HTMLCanvasElement) {
  const box = useRef<{ paths: Map<HTMLElement, SVGPathElement>; starts: Map<HTMLElement, { x: number; y: number }>; canvas: DOMRect | null; offset: { x: number; y: number } }>({
    paths: new Map(),
    starts: new Map(),
    canvas: null,
    offset: { x: 0, y: 0 },
  });
  const scratch = useMemo(() => new Vector3(), []);

  useEffect(() => {
    const svg = document.getElementById(id);
    if (!svg) return;
    const measure = () => {
      const b = box.current;
      b.canvas = null;
      if (svg.getClientRects().length === 0) return; // hidden at this width
      const s = svg.getBoundingClientRect();
      const c = canvas.getBoundingClientRect();
      b.canvas = c;
      b.offset = { x: c.left - s.left, y: c.top - s.top };
      for (const e of ELEMENTS) {
        const label = document.querySelector<HTMLElement>(`[data-label="${e}"]`);
        const path = svg.querySelector<SVGPathElement>(`[data-leader="${e}"]`);
        if (!label || !path) continue;
        const l = label.getBoundingClientRect();
        b.paths.set(label, path);
        b.starts.set(label, { x: l.left - s.left, y: l.top - s.top + l.height / 2 });
        path.dataset.element = e;
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(svg);
    ro.observe(canvas);
    document.querySelectorAll("[data-label]").forEach((el) => ro.observe(el));
    return () => ro.disconnect();
  }, [id, canvas]);

  return useMemo(
    () => ({
      update(group: Group, camera: THREE_Camera) {
        const b = box.current;
        if (!b.canvas) return;
        const { width, height } = b.canvas;
        for (const [label, path] of b.paths) {
          const start = b.starts.get(label)!;
          const [x, y] = toScene(...LEADER_ENDS[path.dataset.element as Element]);
          scratch.set(x, y, FRONT).applyMatrix4(group.matrixWorld).project(camera);
          const ex = b.offset.x + ((scratch.x + 1) / 2) * width;
          const ey = b.offset.y + ((1 - scratch.y) / 2) * height;
          const d = `M${start.x.toFixed(1)} ${start.y.toFixed(1)} L${(start.x - 34).toFixed(1)} ${start.y.toFixed(1)} L${ex.toFixed(1)} ${ey.toFixed(1)}`;
          if (path.getAttribute("d") !== d) path.setAttribute("d", d);
        }
      },
    }),
    [scratch],
  );
}

type THREE_Camera = Parameters<Vector3["project"]>[0];
