"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { CALLOUT, placeCallout, type CalloutSide } from "@/lib/callouts";
import type { LeafGroupId } from "@/lib/deficiency";
import type { UiStrings } from "@/lib/ui";
import type { LeafAnchors } from "./PlantScene";

export type CalloutsHandle = { place: (anchors: LeafAnchors) => void };

const SIDES = ["old", "young"] as const satisfies readonly CalloutSide[];

/**
 * The HTML laid over the explorer page's 3D plant (T-039, Deficiency-Landscape.dc.html): a real button on each
 * leaf group, a label with a leader line to it, and the drag hint. Text never goes into the canvas (D3). The
 * scene calls `place` every frame it draws; positions are written straight to the elements, so turning the plant
 * does not re-render React. Nothing shows until the first call, and CSS hides it all when the flat plant stands in.
 */
export function DefCallouts({
  ui,
  selected,
  onSelect,
  groupLabel,
  ref,
}: {
  ui: UiStrings;
  selected: LeafGroupId;
  onSelect: (id: CalloutSide) => void;
  groupLabel: Readonly<Record<CalloutSide, string>>;
  ref: Ref<CalloutsHandle>;
}) {
  const root = useRef<HTMLDivElement>(null);
  const hotspots = useRef<Partial<Record<CalloutSide, HTMLButtonElement | null>>>({});
  const labels = useRef<Partial<Record<CalloutSide, HTMLDivElement | null>>>({});
  const leaders = useRef<Partial<Record<CalloutSide, HTMLDivElement | null>>>({});
  const last = useRef("");
  const latest = useRef<LeafAnchors | null>(null);
  // The labels' sizes, kept by a ResizeObserver rather than read each frame (a read after the last frame's writes
  // would force a layout every frame). A size change (the web font arriving, crossing 40em) places them again.
  const sizes = useRef<Record<CalloutSide, { w: number; h: number }>>({ old: { w: 0, h: 0 }, young: { w: 0, h: 0 } });

  const place = (anchors: LeafAnchors) => {
    latest.current = anchors;
    const s = sizes.current;
    const key = [anchors.old.x, anchors.old.y, anchors.young.x, anchors.young.y, anchors.w, anchors.h, s.old.w, s.old.h, s.young.w, s.young.h]
      .map((n) => n.toFixed(1))
      .join();
    if (key === last.current || !root.current) return;
    last.current = key;
    const frame = { w: anchors.w, h: anchors.h };
    for (const side of SIDES) {
      const c = placeCallout(side, anchors[side], frame, s[side]);
      const spot = hotspots.current[side];
      const label = labels.current[side];
      const line = leaders.current[side];
      if (spot) spot.style.transform = `translate(${c.hotspot.x}px, ${c.hotspot.y}px)`;
      if (label) label.style.transform = `translate(${c.label.x}px, ${c.label.y}px)`;
      if (line) {
        const { x1, y1, x2, y2 } = c.leader;
        line.style.width = `${Math.hypot(x2 - x1, y2 - y1)}px`;
        line.style.transform = `translate(${x1}px, ${y1}px) rotate(${Math.atan2(y2 - y1, x2 - x1)}rad)`;
      }
    }
    root.current.dataset.ready = "";
  };

  useImperativeHandle(ref, () => ({ place }));

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      for (const side of SIDES) {
        const el = labels.current[side];
        sizes.current[side] = { w: el?.offsetWidth ?? 0, h: el?.offsetHeight ?? 0 };
      }
      if (latest.current) place(latest.current);
    });
    for (const side of SIDES) {
      const el = labels.current[side];
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []); // `place` reads only refs, so the observer made on mount stays correct.

  const name = { old: ui.defOld, young: ui.defYoung };
  const pick = { old: ui.defPickOld, young: ui.defPickYoung };
  return (
    <div className="def-callouts" ref={root}>
      {SIDES.map((side) => (
        <div key={`leader-${side}`} className="def-leader" aria-hidden="true" ref={(el) => void (leaders.current[side] = el)} />
      ))}
      {SIDES.map((side) => (
        <div key={`label-${side}`} className={`def-callout def-callout-${side}`} aria-hidden="true" ref={(el) => void (labels.current[side] = el)}>
          <span className="def-callout-name">{name[side]}</span>
          <span className="def-callout-group">{groupLabel[side]}</span>
        </div>
      ))}
      {SIDES.map((side) => (
        <button
          key={`spot-${side}`}
          type="button"
          className={`def-hotspot def-hotspot-${side}`}
          style={{ width: CALLOUT[side].size, height: CALLOUT[side].size }}
          aria-label={pick[side]}
          aria-pressed={selected === side}
          onClick={() => onSelect(side)}
          ref={(el) => void (hotspots.current[side] = el)}
        />
      ))}
      <p className="def-hint">{ui.defHint}</p>
    </div>
  );
}
