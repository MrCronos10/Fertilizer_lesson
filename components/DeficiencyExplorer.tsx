"use client";

import { useId, useState } from "react";
import { RULE_PAGE, type LeafGroup, type LeafGroupId } from "@/lib/deficiency";
import type { UiStrings } from "@/lib/ui";
import { PlantExplorer } from "./PlantExplorer";

/**
 * Pick where on the plant to look and see the pamphlet's p3 lines for it (T-018).
 * The radios are the real control and the 3D plant is a second way to make the same
 * choice, so the explorer works with no WebGL, no touch and no pointer. The panel is
 * a polite live region, so a choice is announced.
 */
export function DeficiencyExplorer({ ui, groups }: { ui: UiStrings; groups: readonly LeafGroup[] }) {
  const name = useId();
  const [selected, setSelected] = useState<LeafGroupId>("old");
  const group = groups.find((g) => g.id === selected) ?? groups[0];

  const label: Record<LeafGroupId, string> = { old: ui.defOld, young: ui.defYoung, unplaced: ui.defUnplaced };
  const rule: Record<LeafGroupId, string> = { old: ui.defRuleOld, young: ui.defRuleYoung, unplaced: ui.defRuleNone };

  return (
    <section className="deficiency">
      <fieldset className="def-choice">
        <legend>{ui.defLegend}</legend>
        {groups.map((g) => (
          <label key={g.id} className="def-option">
            <input
              type="radio"
              name={`${name}-leaf`}
              value={g.id}
              checked={selected === g.id}
              onChange={() => setSelected(g.id)}
            />
            <span>{label[g.id]}</span>
          </label>
        ))}
      </fieldset>

      <PlantExplorer
        label={ui.defSceneLabel}
        fallback={<p className="scene3d-fallback">{ui.defNo3d}</p>}
        selected={selected}
        onSelect={setSelected}
      />

      <div role="status" aria-live="polite" aria-atomic="true" className="def-panel">
        {group ? (
          <div key={group.id} className="panel" data-group={group.id}>
            <p className="def-rule">{rule[group.id]}</p>
            <dl className="def-list">
              {group.entries.map((e) => (
                <div key={e.id} data-row={e.id}>
                  <dt lang="en">{e.elements}</dt>
                  <dd>{e.symptom}</dd>
                </div>
              ))}
            </dl>
            <p className="muted">
              {ui.pamphletPages}: {group.id === "unplaced" ? "" : `${RULE_PAGE}, `}
              {group.entries[0]?.sourcePage}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
