/**
 * Pure maths for the plant's touch and mouse gestures (T-018), kept out of the
 * component so the limits are testable without a browser.
 */
export const ZOOM = { min: 2.5, max: 7, start: 4 } as const;
export const PAN_LIMIT = 1.5;
/** Radians of turn per pixel dragged. */
export const YAW_PER_PX = 0.01;
/** A press that moves less than this many CSS px is a tap, not a drag. */
export const TAP_SLOP_PX = 6;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function clampZoom(distance: number): number {
  return Number.isFinite(distance) ? clamp(distance, ZOOM.min, ZOOM.max) : ZOOM.start;
}

/** Fingers spreading (ratio > 1) bring the camera closer. A zero or broken ratio changes nothing. */
export function pinchZoom(distance: number, ratio: number): number {
  if (!Number.isFinite(ratio) || ratio <= 0) return clampZoom(distance);
  return clampZoom(distance / ratio);
}

export function dragYaw(yaw: number, dxPx: number): number {
  return Number.isFinite(dxPx) ? yaw + dxPx * YAW_PER_PX : yaw;
}

export function clampPan(v: number): number {
  return Number.isFinite(v) ? clamp(v, -PAN_LIMIT, PAN_LIMIT) : 0;
}

export function isTap(totalMovePx: number): boolean {
  return totalMovePx < TAP_SLOP_PX;
}

/**
 * How far the camera sits for a given zoom in a box of `aspect` (width / height). The field of view is
 * vertical, so a box taller than wide sees less to the sides; chapter 1's 200 x 226 box (T-032) cut off
 * the spinning leaves. Backing off by 1 / aspect gives such a box at least a square box's side room. `zoom`
 * itself, which the gestures clamp and e2e reads, is unchanged.
 */
export function cameraDistance(zoom: number, aspect: number): number {
  return aspect >= 1 ? zoom : zoom / aspect;
}
