import { describe, expect, it } from "vitest";
import {
  CONTENT,
  FOV_DEG,
  PARTICLE_RANGE,
  REST_YAW,
  cameraDistance,
  easeYaw,
  gradientAt,
  particleT,
  toScene,
} from "./hero-scene";

describe("toScene: Main.dc.html pixels → scene units", () => {
  it("puts the canvas centre at the origin and 100 px in one unit, y up", () => {
    expect(toScene(860, 278)).toEqual([0, 0]);
    expect(toScene(960, 178)).toEqual([1, 1]);
    // The soil block's corners in the artboard.
    expect(toScene(700, 430)).toEqual([-1.6, -1.52]);
    expect(toScene(1012, 244)).toEqual([1.52, 0.34]);
  });
});

describe("cameraDistance", () => {
  const visible = (d: number, aspect: number) => {
    const h = 2 * d * Math.tan(((FOV_DEG / 2) * Math.PI) / 180);
    return { w: h * aspect, h };
  };
  it("frames the whole drawing at any canvas shape, touching the tighter side", () => {
    for (const aspect of [0.5, CONTENT.w / CONTENT.h, 1, 2]) {
      const { w, h } = visible(cameraDistance(aspect), aspect);
      expect(w).toBeGreaterThanOrEqual(CONTENT.w - 1e-9);
      expect(h).toBeGreaterThanOrEqual(CONTENT.h - 1e-9);
      expect(Math.min(w - CONTENT.w, h - CONTENT.h)).toBeCloseTo(0, 9);
    }
  });
  it("matches the artboard's scale on the landscape canvas (360 × 372 px is 3.6 × 3.72 units)", () => {
    expect(visible(cameraDistance(360 / 372), 360 / 372).w).toBeCloseTo(3.6, 9);
  });
  it("survives a zero-sized canvas", () => {
    expect(Number.isFinite(cameraDistance(0))).toBe(true);
  });
});

describe("easeYaw", () => {
  it("returns toward the resting view and never overshoots", () => {
    let yaw = 1.5;
    for (let i = 0; i < 200; i++) {
      const next = easeYaw(yaw, 1 / 60);
      expect(Math.abs(next - REST_YAW)).toBeLessThanOrEqual(Math.abs(yaw - REST_YAW));
      yaw = next;
    }
    expect(yaw).toBeCloseTo(REST_YAW, 3);
  });
  it("is unchanged by a zero or broken frame time", () => {
    expect(easeYaw(1, 0)).toBe(1);
    expect(easeYaw(1, Number.NaN)).toBe(1);
  });
});

describe("particleT", () => {
  it("starts where the artboard drew the particle", () => {
    expect(particleT(0.7, 0)).toBeCloseTo(0.7);
  });
  it("rises toward the stem (t falls) and wraps back to the deep end", () => {
    expect(particleT(0.7, 1)).toBeLessThan(0.7);
    const [lo, hi] = PARTICLE_RANGE;
    for (let s = 0; s < 40; s += 0.37) {
      const t = particleT(0.5, s);
      expect(t).toBeGreaterThanOrEqual(lo);
      expect(t).toBeLessThanOrEqual(hi);
    }
  });
});

describe("gradientAt", () => {
  const stops = [
    { y: 1, color: [1, 0, 0] as const },
    { y: 0, color: [0, 1, 0] as const },
    { y: -1, color: [0, 0, 1] as const },
  ];
  it("hits each stop exactly and is linear between", () => {
    expect(gradientAt(1, stops)).toEqual([1, 0, 0]);
    expect(gradientAt(0, stops)).toEqual([0, 1, 0]);
    expect(gradientAt(-0.5, stops)).toEqual([0, 0.5, 0.5]);
  });
  it("clamps outside the stops", () => {
    expect(gradientAt(5, stops)).toEqual([1, 0, 0]);
    expect(gradientAt(-5, stops)).toEqual([0, 0, 1]);
  });
});
