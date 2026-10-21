"use client";

import { useId, useState } from "react";
import type { CropId, CropView, GuidanceView, SourceChip } from "@/lib/crop-matcher";
import type { UiStrings } from "@/lib/ui";
import { RateBlock } from "./Rate";
import { TierBadge } from "./TierBadge";

function Chip({ chip, ui }: { chip: SourceChip; ui: UiStrings }) {
  const body = (
    <>
      <span lang="en">{chip.name}</span> <TierBadge tier={chip.tier} ui={ui} />
      {chip.unnamed > 0 ? ` +${chip.unnamed}` : null}
    </>
  );
  return (
    <span className="crop-source" data-source={chip.id}>
      {chip.linked ? (
        <a href={`#src-${chip.id}`} data-cite={chip.id}>
          {body}
        </a>
      ) : (
        body
      )}
    </span>
  );
}

function Item({ g, ui, actionable }: { g: GuidanceView; ui: UiStrings; actionable: boolean }) {
  return (
    <li className="crop-item" data-actionable={actionable} data-guidance={g.key}>
      {/* The pamphlet's own wording, verbatim. This table is printed in English, and
          D6 forbids writing new agronomic Thai, so it is shown as printed, not translated. */}
      <p className="crop-text" lang="en">
        {g.text}
      </p>
      {actionable && (g.grades.length > 0 || g.rate) ? (
        <p className="crop-figures">
          {/* The source calls this figure "regional" (CIAT), not Thai; say so beside the number. */}
          {g.scope === "REGIONAL" ? (
            <span className="tier" lang="en" data-scope="regional">
              regional
            </span>
          ) : null}{" "}
          {g.grades.length > 0 ? (
            <>
              {ui.colGrade}:{" "}
              {g.grades.map((grade, i) => (
                <span key={grade}>
                  {i > 0 ? " / " : null}
                  <span className="num" data-grade>
                    {grade}
                  </span>
                </span>
              ))}
            </>
          ) : null}
          {g.grades.length > 0 && g.rate ? " · " : null}
          {g.rate ? (
            <>
              {ui.cropRate}{" "}
              <span className="num" data-crop-rate>
                {g.rate}
              </span>{" "}
              <span lang="en" data-unit>
                {g.unit}
              </span>
            </>
          ) : null}
        </p>
      ) : null}
      {g.sources.length > 0 ? (
        <p className="crop-sources muted">
          {g.sources.map((chip) => (
            <Chip key={chip.id} chip={chip} ui={ui} />
          ))}
        </p>
      ) : null}
    </li>
  );
}

/**
 * Pick a crop, see what the pamphlet's p12–13 table says for it (T-020). Real radios,
 * so touch, click and arrow keys all work and nothing is hover-only. Numbers appear only
 * for guidance the data layer marked actionable; everything else is the source's own text
 * under a heading that says it is not a recommended figure. A crop with no actionable
 * guidance says so outright. The soil-test note rides on every panel (RateBlock). Only the
 * crop's name (and the no-source warning) is announced on a change, not the whole panel.
 */
export function CropMatcher({ ui, crops }: { ui: UiStrings; crops: readonly CropView[] }) {
  const name = useId();
  const [selected, setSelected] = useState<CropId>("rice");
  const crop = crops.find((c) => c.id === selected) ?? crops[0];

  return (
    <section className="crop-matcher">
      <fieldset className="def-choice crop-choice">
        <legend>{ui.cropLegend}</legend>
        {crops.map((c) => (
          <label key={c.id} className="def-option">
            <input
              type="radio"
              name={`${name}-crop`}
              value={c.id}
              checked={selected === c.id}
              onChange={() => setSelected(c.id)}
            />
            <span>{c.label}</span>
          </label>
        ))}
      </fieldset>

      {/* Only the choice is announced; the panel itself is long (sources, rows) and is read by moving into it. */}
      <p role="status" aria-live="polite" aria-atomic="true" className="visually-hidden" data-announce>
        {crop ? `${crop.label}${crop.reliable ? "" : `. ${ui.cropNoReliable}`}` : null}
      </p>
      <div className="crop-panel">
        {crop ? (
          <div key={crop.id} className="panel" data-crop={crop.id} data-reliable={crop.reliable}>
            <RateBlock ui={ui}>
              <h3 className="crop-name">{crop.label}</h3>
              {crop.rows.map((row) => (
                <section key={row.id} className="crop-row" data-row={row.id}>
                  {crop.rows.length > 1 ? <h4>{row.label}</h4> : null}
                  {!row.hasActionable ? (
                    <p className="note" data-no-reliable role="note">
                      {ui.cropNoReliable}
                    </p>
                  ) : null}
                  {row.stages.map((stage) => (
                    <div key={stage.stage} className="crop-stage" data-stage={stage.stage}>
                      <h5>{stage.stage === "basal" ? ui.cropBasal : ui.cropTopDressing}</h5>
                      {stage.actionable.length > 0 ? (
                        <ul className="crop-list">
                          {stage.actionable.map((g) => (
                            <Item key={g.key} g={g} ui={ui} actionable />
                          ))}
                        </ul>
                      ) : null}
                      {stage.descriptive.length > 0 ? (
                        <>
                          <p className="muted crop-descriptive-heading">{ui.cropDescriptiveHeading}</p>
                          <ul className="crop-list">
                            {stage.descriptive.map((g) => (
                              <Item key={g.key} g={g} ui={ui} actionable={false} />
                            ))}
                          </ul>
                        </>
                      ) : null}
                    </div>
                  ))}
                  <p className="muted">
                    {ui.sources}: <span lang="en">{row.sourceNote}</span> · {ui.pamphletPages}: {row.sourcePage}
                  </p>
                </section>
              ))}
            </RateBlock>
          </div>
        ) : null}
      </div>
    </section>
  );
}
