"use client";

import { useId, useState, type ReactNode } from "react";
import { RULE_PAGE, ruleElements, ruleGroupLabel, type LeafGroup, type LeafGroupId } from "@/lib/deficiency";
import type { Tier } from "@/lib/sources";
import type { UiStrings } from "@/lib/ui";
import { FlatPlant } from "./FlatPlant";
import { NearViewport } from "./NearViewport";
import { PlantExplorer } from "./PlantExplorer";
import { TierBadge } from "./TierBadge";

/** What the answer panel's source line needs, read on the server so the bibliography stays out of this chunk. */
export type PageSource = { readonly name: string; readonly tier: Tier; readonly unnamed: number };

/**
 * The deficiency explorer page's interactive half (T-037): the picture, the leaf picker and the answer panel.
 * `left` and `right` are the server-rendered blocks that sit under each column (sources; rules, strip and next
 * link), so the answer can sit in the right column while the picture and picker sit in the left.
 * The picture is the 3D plant (T-038), fetched when it is about to be seen; the flat plant stands in without WebGL.
 */
export function DefPageExplorer({
  ui,
  groups,
  source,
  left,
  right,
}: {
  ui: UiStrings;
  groups: readonly LeafGroup[];
  source: PageSource;
  left: ReactNode;
  right: ReactNode;
}) {
  const name = useId();
  const [selected, setSelected] = useState<LeafGroupId>("old");
  const group = groups.find((g) => g.id === selected) ?? groups[0];

  const label: Record<LeafGroupId, string> = { old: ui.defOld, young: ui.defYoung, unplaced: ui.defBadgeNone };
  const choice: Record<LeafGroupId, string> = { old: ui.defOld, young: ui.defYoung, unplaced: ui.defUnplaced };
  const rule: Record<LeafGroupId, string> = { old: ui.defRuleOld, young: ui.defRuleYoung, unplaced: ui.defRuleNone };
  const groupLabel: Record<LeafGroupId, string> = {
    old: ruleGroupLabel(ui.defRuleOld),
    young: ruleGroupLabel(ui.defRuleYoung),
    unplaced: ui.defGroupNone,
  };
  const chips = selected === "unplaced" ? [] : ruleElements(rule[selected]);
  const pages = group ? `${selected === "unplaced" ? "" : `${RULE_PAGE}, `}${group.entries[0]?.sourcePage}` : "";

  return (
    <div className="def-layout">
      <div className="def-col def-col-left">
        <div className="def-picture">
          <NearViewport placeholder={<div className="scene3d" aria-hidden="true" />}>
            <PlantExplorer
              label={ui.defSceneLabel}
              fallback={
                <figure className="scene3d-fallback flat-fallback">
                  <FlatPlant selected={selected} label={ui.defFlatLabel} />
                  <figcaption>{ui.defNo3d}</figcaption>
                </figure>
              }
              selected={selected}
              onSelect={setSelected}
              stage="page"
            />
          </NearViewport>
        </div>
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
              <span>{choice[g.id]}</span>
            </label>
          ))}
        </fieldset>
        {left}
      </div>

      <div className="def-col def-col-right">
        <div role="status" aria-live="polite" aria-atomic="true" className="def-answer-wrap">
          <section key={selected} className="def-answer" data-group={selected}>
            <p className="def-answer-head">
              <span className="def-badge" aria-hidden="true">
                {label[selected]}
              </span>
              <span className="def-group-label">{groupLabel[selected]}</span>
            </p>
            <p className="def-answer-text">{rule[selected]}</p>
            {chips.length > 0 ? (
              <ul className="def-chips" aria-label={groupLabel[selected]}>
                {chips.map((e) => (
                  <li key={e} className={`def-chip def-chip-${e.toLowerCase()}`} lang="en">
                    {e}
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="def-answer-source">
              <span className="muted">{ui.sourceLabel}</span>
              <a href="#src-uga" lang="en">
                {source.name}
              </a>
              <TierBadge tier={source.tier} ui={ui} />
              <span className="muted">
                {ui.pamphletPages}: {pages}
              </span>
            </p>
          </section>
        </div>
        {right}
      </div>
    </div>
  );
}
