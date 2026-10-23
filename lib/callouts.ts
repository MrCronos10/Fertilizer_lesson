/**
 * Where the explorer page's hotspots, labels and leader lines go (T-039), given the point on screen the 3D scene
 * reports for each leaf group. The offsets are Deficiency-Landscape.dc.html's: the old-leaf hotspot (72 px) with its
 * label to the left, the young-leaf hotspot (68 px) with its label up and to the right. Everything follows the
 * anchor, so the callouts move with the plant when it is turned, zoomed or panned; a hotspot or label that would
 * leave the frame is held inside it, so no part of a tap target is cut off.
 */
export type CalloutSide = "old" | "young";
type Point = { readonly x: number; readonly y: number };
type Size = { readonly w: number; readonly h: number };

export type Callout = {
  readonly hotspot: { readonly x: number; readonly y: number; readonly size: number };
  readonly label: Point;
  readonly leader: { readonly x1: number; readonly y1: number; readonly x2: number; readonly y2: number };
};

export const CALLOUT = {
  /** No label comes closer than this to the frame's edge. */
  margin: 12,
  old: { size: 72, labelRight: -92, labelTop: -31, leaderFromLabel: 27, leaderEnd: { dx: -43, dy: -2 } },
  young: { size: 68, labelLeft: 123, labelTop: -65, leaderFromLabel: 49, leaderEnd: { dx: 76, dy: -7 } },
} as const;

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), Math.max(lo, hi));

export function placeCallout(side: CalloutSide, anchor: Point, frame: Size, label: Size): Callout {
  const { margin } = CALLOUT;
  const size = CALLOUT[side].size;
  const hotspot = {
    x: clamp(anchor.x - size / 2, 0, frame.w - size),
    y: clamp(anchor.y - size / 2, 0, frame.h - size),
    size,
  };
  const rawX = side === "old" ? anchor.x + CALLOUT.old.labelRight - label.w : anchor.x + CALLOUT.young.labelLeft;
  const at = {
    x: clamp(rawX, margin, frame.w - label.w - margin),
    y: clamp(anchor.y + CALLOUT[side].labelTop, margin, frame.h - label.h - margin),
  };
  // The artboard's two lines, M176 352 L220 354 and M562 162 L520 170 at 826/738: from the label's edge to a point
  // fixed to the hotspot (the old one 7 px short of its rim; the young one stops well short, as drawn).
  const end = CALLOUT[side].leaderEnd;
  const leader = {
    x1: side === "old" ? at.x + label.w : at.x,
    y1: at.y + CALLOUT[side].leaderFromLabel,
    x2: anchor.x + end.dx,
    y2: anchor.y + end.dy,
  };
  return { hotspot, label: at, leader };
}
