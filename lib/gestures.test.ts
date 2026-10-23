import { describe, expect, it } from "vitest";
import { PAN_LIMIT, TAP_SLOP_PX, YAW_PER_PX, ZOOM, clampPan, cameraDistance, clampZoom, dragYaw, isTap, pinchZoom } from "./gestures";

describe("zoom", () => {
  it("clamps to the camera limits", () => {
    expect(clampZoom(0.1)).toBe(ZOOM.min);
    expect(clampZoom(100)).toBe(ZOOM.max);
    expect(clampZoom(4)).toBe(4);
  });
  it("falls back to the start distance for a broken value", () => {
    expect(clampZoom(Number.NaN)).toBe(ZOOM.start);
    expect(clampZoom(Number.POSITIVE_INFINITY)).toBe(ZOOM.start);
  });
  it("spreading fingers moves the camera closer, pinching moves it away", () => {
    expect(pinchZoom(4, 2)).toBe(2.5); // would be 2, clamped
    expect(pinchZoom(4, 1.25)).toBeCloseTo(3.2);
    expect(pinchZoom(4, 0.5)).toBe(7); // would be 8, clamped
  });
  it("ignores a zero, negative or broken ratio", () => {
    for (const r of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) expect(pinchZoom(4, r)).toBe(4);
  });
});

describe("drag, pan and tap", () => {
  it("turns by a fixed amount per pixel, and not at all for a broken move", () => {
    expect(dragYaw(1, 100)).toBeCloseTo(1 + 100 * YAW_PER_PX);
    expect(dragYaw(1, -50)).toBeCloseTo(1 - 50 * YAW_PER_PX);
    expect(dragYaw(1, Number.NaN)).toBe(1);
  });
  it("keeps the pan inside the limit", () => {
    expect(clampPan(99)).toBe(PAN_LIMIT);
    expect(clampPan(-99)).toBe(-PAN_LIMIT);
    expect(clampPan(0.4)).toBe(0.4);
    expect(clampPan(Number.NaN)).toBe(0);
  });
  it("treats a small movement as a tap and a larger one as a drag", () => {
    expect(isTap(0)).toBe(true);
    expect(isTap(TAP_SLOP_PX - 0.01)).toBe(true);
    expect(isTap(TAP_SLOP_PX)).toBe(false);
  });
});

describe("cameraDistance", () => {
  it("is the zoom itself in a box as wide as it is tall, or wider", () => {
    expect(cameraDistance(4, 1)).toBe(4);
    expect(cameraDistance(4, 4 / 3)).toBe(4);
  });
  it("backs off in a box taller than it is wide, so the leaves keep a square box's side room", () => {
    expect(cameraDistance(4, 200 / 226)).toBeCloseTo(4 * (226 / 200), 6);
    expect(cameraDistance(4, 0.5)).toBe(8);
  });
});
