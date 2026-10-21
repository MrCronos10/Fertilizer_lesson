"use client";

import { useId, useState } from "react";
import type { BagTile } from "@/lib/bag-reader";
import type { Nutrient } from "@/lib/calculator";
import type { UiStrings } from "@/lib/ui";

/** Pages the explanations come from: the p2 table, and the p6 worked example. */
export const BAG_SOURCE_PAGES = [2, 6] as const;

/**
 * A 2D bag label whose three numbers are tappable (T-015). Native radios, so
 * touch, click and arrow keys all work with no hover and no script-only
 * affordance; the label is real text, not a canvas. The panel is a polite live
 * region, so choosing a number is announced.
 */
export function BagReaderIsland({
  ui,
  tiles,
  weightKg,
}: {
  ui: UiStrings;
  tiles: readonly BagTile[];
  weightKg: number;
}) {
  const name = useId();
  // N is already chosen, so the page never shows an empty explanation.
  const [selected, setSelected] = useState<Nutrient>("n");
  const tile = tiles.find((t) => t.id === selected) ?? tiles[0];

  return (
    <section className="bag-reader">
      <fieldset className="bag">
        <legend>{ui.bagLegend}</legend>
        <div className="bag-body">
          <div className="bag-tiles">
            {tiles.map((t) => (
              <label key={t.id} className="bag-tile">
                {/* The radio carries the whole name (symbol, number, then the word "percent"), so the
                    visible symbol and number are hidden from assistive tech rather than read twice. */}
                <input
                  type="radio"
                  className="bag-input"
                  name={`${name}-nutrient`}
                  aria-label={`${t.symbol} ${t.percent} ${ui.bagPercent}`}
                  checked={selected === t.id}
                  onChange={() => setSelected(t.id)}
                />
                <span className="bag-symbol" lang="en" aria-hidden="true">
                  {t.symbol}
                </span>
                <span className="bag-number" aria-hidden="true">
                  {t.percent}
                </span>
              </label>
            ))}
          </div>
          <p className="bag-weight">
            {weightKg} {ui.calcKg}
          </p>
        </div>
      </fieldset>

      <div role="status" aria-live="polite" aria-atomic="true" className="bag-panel">
        {tile ? (
          <div key={tile.id} className="panel">
            <p className="bag-role">{tile.role}</p>
            <p>
              {ui.bagWord} {weightKg} {ui.calcKg}{" "}
              {tile.amountKg > 0 ? (
                <>
                  {ui.bagHas} <span lang="en">{tile.symbol}</span> <span className="num">{tile.amountKg}</span> {ui.calcKg}
                </>
              ) : (
                <>
                  {ui.bagNone} <span lang="en">K</span>
                </>
              )}
            </p>
            <p className="muted">
              {ui.pamphletPages}: {BAG_SOURCE_PAGES.join(", ")}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
