/**
 * Pure maths for the home hero's 3D soil block (T-027), kept out of the component so it is
 * testable without a browser. The drawing is specified by Main.dc.html in pixels; the scene uses
 * the same numbers at 100 px to one unit, centred on the landscape canvas box (860, 278).
 */

const ORIGIN = { x: 860, y: 278 } as const;
const PX_PER_UNIT = 100;

const round = (v: number) => Math.round(v * 1e6) / 1e6;

/** An artboard point in scene units, y up. */
export function toScene(x: number, y: number): [number, number] {
  return [round((x - ORIGIN.x) / PX_PER_UNIT), round((ORIGIN.y - y) / PX_PER_UNIT)];
}

/** The landscape canvas box, 360 × 372 px, in units: everything drawn fits inside it. */
export const CONTENT = { w: 3.6, h: 3.72 } as const;
export const FOV_DEG = 30;

/** How far back the camera stands so CONTENT fits the canvas, whatever its shape. */
export function cameraDistance(aspect: number): number {
  const a = Number.isFinite(aspect) && aspect > 0 ? aspect : CONTENT.w / CONTENT.h;
  const height = Math.max(CONTENT.h, CONTENT.w / a);
  return height / (2 * Math.tan(((FOV_DEG / 2) * Math.PI) / 180));
}

/** Turned a little toward the reader's right, so the block's side face shows as in the artboard. */
export const REST_YAW = -0.28;
const RETURN_RATE = 4;

/** After a drag, the block settles back to the composition the labels point at. */
export function easeYaw(yaw: number, delta: number): number {
  if (!Number.isFinite(delta) || delta <= 0) return yaw;
  return yaw + (REST_YAW - yaw) * Math.min(1, delta * RETURN_RATE);
}

/** Particles ride their root from the deep end (t high) up toward the stem (t low), then start again. */
export const PARTICLE_RANGE = [0.12, 0.95] as const;
const RISE_PER_SECOND = 0.12;

export function particleT(t0: number, seconds: number): number {
  const [lo, hi] = PARTICLE_RANGE;
  const span = hi - lo;
  const travelled = (((hi - t0 + seconds * RISE_PER_SECOND) % span) + span) % span;
  return hi - travelled;
}

export type Stop = { readonly y: number; readonly color: readonly [number, number, number] };

/** A vertical linear gradient, stops ordered top to bottom: the colour at height y. */
export function gradientAt(y: number, stops: readonly Stop[]): [number, number, number] {
  const first = stops[0]!;
  const last = stops[stops.length - 1]!;
  if (y >= first.y) return [...first.color];
  if (y <= last.y) return [...last.color];
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]!;
    const b = stops[i + 1]!;
    if (y <= a.y && y >= b.y) {
      const k = (a.y - y) / (a.y - b.y);
      return [0, 1, 2].map((c) => round(a.color[c]! + (b.color[c]! - a.color[c]!) * k)) as [number, number, number];
    }
  }
  return [...last.color];
}
