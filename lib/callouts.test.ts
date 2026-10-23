import { describe, expect, it } from "vitest";
import { CALLOUT, placeCallout } from "./callouts";

const FRAME = { w: 826, h: 582 };
const LABEL = { w: 170, h: 68 };

describe("placeCallout", () => {
  it("puts the hotspots where Deficiency-Landscape.dc.html draws them, at its sizes", () => {
    const old = placeCallout("old", { x: 289, y: 398 }, FRAME, LABEL);
    expect(old.hotspot).toEqual({ x: 253, y: 362, size: 72 });
    const young = placeCallout("young", { x: 506, y: 197 }, FRAME, { w: 179, h: 68 });
    expect(young.hotspot).toEqual({ x: 472, y: 163, size: 68 });
  });

  it("sets the old-leaf label left of its hotspot and the young-leaf label right of it, as drawn", () => {
    expect(placeCallout("old", { x: 289, y: 398 }, FRAME, LABEL).label).toEqual({ x: 27, y: 367 });
    expect(placeCallout("young", { x: 506, y: 197 }, FRAME, { w: 179, h: 68 }).label).toEqual({ x: 629, y: 132 });
  });

  it("draws each leader line where the artboard does (its viewBox lines scaled 826/738, to the pixel)", () => {
    const old = placeCallout("old", { x: 289, y: 398 }, FRAME, LABEL).leader;
    expect(old).toEqual({ x1: 197, y1: 394, x2: 246, y2: 396 });
    const young = placeCallout("young", { x: 506, y: 197 }, FRAME, { w: 179, h: 68 }).leader;
    expect(young).toEqual({ x1: 629, y1: 181, x2: 582, y2: 190 });
  });

  it("in the portrait frame (738 wide) lands on Deficiency-Portrait.dc.html's numbers, the same picture scaled", () => {
    const frame = { w: 738, h: 520 };
    const near = (got: Record<string, number>, want: Record<string, number>) =>
      Object.entries(want).forEach(([k, v]) => expect(Math.abs(got[k]! - v), k).toBeLessThanOrEqual(1));
    const old = placeCallout("old", { x: 258, y: 356 }, frame, { w: 152, h: 62 });
    expect(old.hotspot).toEqual({ x: 222, y: 320, size: 72 });
    near(old.label, { x: 24, y: 328 });
    const young = placeCallout("young", { x: 452, y: 176 }, frame, { w: 160, h: 62 });
    expect(young.hotspot).toEqual({ x: 418, y: 142, size: 68 });
    near(young.label, { x: 562, y: 118 });
    // The artboard's lines, M176 352 L220 354 and M562 162 L520 170, drawn 1:1 in this frame.
    near(old.leader, { x1: 176, y1: 352, x2: 220, y2: 354 });
    near(young.leader, { x1: 562, y1: 162, x2: 520, y2: 170 });
  });

  it("follows the anchor: a turned or panned plant moves the hotspot, label and leader together", () => {
    const a = placeCallout("old", { x: 289, y: 398 }, FRAME, LABEL);
    const b = placeCallout("old", { x: 319, y: 378 }, FRAME, LABEL);
    expect(b.hotspot.x - a.hotspot.x).toBe(30);
    expect(b.label.y - a.label.y).toBe(-20);
    expect(b.leader.x2 - a.leader.x2).toBe(30);
  });

  it("keeps a label inside the frame when the anchor runs near an edge", () => {
    const old = placeCallout("old", { x: 120, y: 560 }, FRAME, LABEL);
    expect(old.label.x).toBe(CALLOUT.margin);
    expect(old.label.y + LABEL.h).toBeLessThanOrEqual(FRAME.h - CALLOUT.margin);
    const young = placeCallout("young", { x: 760, y: 10 }, FRAME, { w: 179, h: 68 });
    expect(young.label.x + 179).toBeLessThanOrEqual(FRAME.w - CALLOUT.margin);
    expect(young.label.y).toBe(CALLOUT.margin);
  });

  it("holds a hotspot wholly inside the frame when a pan or zoom carries its leaves to the edge", () => {
    const old = placeCallout("old", { x: 10, y: 575 }, FRAME, LABEL).hotspot;
    expect(old).toEqual({ x: 0, y: 582 - 72, size: 72 });
    const young = placeCallout("young", { x: 820, y: 5 }, FRAME, LABEL).hotspot;
    expect(young).toEqual({ x: 826 - 68, y: 0, size: 68 });
  });
});
