"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import type { Nutrient } from "@/lib/calculator";
import {
  formatNumber,
  runForm,
  summaryLine,
  workingLines,
  type FormErrorCode,
  type FormField,
  type FormResult,
  type FormState,
} from "@/lib/calculator-form";
import type { PublishedGrade } from "@/lib/calculator-data";
import type { UiStrings } from "@/lib/ui";
import { RateBlock } from "./Rate";

/**
 * Pages of the pamphlet this result rests on: the formula and the worked
 * example (p6) and the soil-test sentence shown with it (p3). Pinned to the raw
 * pages by `lib/calculator-form.test.ts`.
 */
export const CALCULATOR_SOURCE_PAGES = [3, 6] as const;

const NUTRIENTS: readonly { readonly id: Nutrient; readonly symbol: string }[] = [
  { id: "n", symbol: "N" },
  { id: "p2o5", symbol: "P₂O₅" },
  { id: "k2o", symbol: "K₂O" },
];

const ERROR_KEY = {
  "target-empty": "calcErrTargetEmpty",
  "not-a-number": "calcErrNotNumber",
  "target-invalid": "calcErrTargetInvalid",
  "grade-empty": "calcErrGradeEmpty",
  "grade-invalid": "calcErrGradeInvalid",
  "nutrient-zero": "calcErrNutrientZero",
  "result-invalid": "calcErrResult",
} as const satisfies Record<FormErrorCode, keyof UiStrings>;

const EMPTY: FormState = { nutrient: "n", target: "", n: "", p2o5: "", k2o: "" };

/**
 * Touch-first calculator (T-014). It computes only when asked and clears its
 * answer the moment anything changes, so an old dose is never left on screen
 * next to new inputs. The result sits in a polite live region, which is what
 * makes VoiceOver announce it; errors use a separate alert.
 */
export function CalculatorForm({ ui, grades }: { ui: UiStrings; grades: readonly PublishedGrade[] }) {
  const id = useId();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [picked, setPicked] = useState("");
  const [outcome, setOutcome] = useState<FormResult | null>(null);
  // Bumped on every submit and used as a key, so an identical answer or error replaces
  // its node: a screen reader announces a changed DOM, not text that happens to match.
  const [submits, setSubmits] = useState(0);
  const fields = useRef<Partial<Record<FormField, HTMLInputElement | null>>>({});

  const change = (patch: Partial<FormState>) => {
    setForm((f) => ({ ...f, ...patch }));
    setOutcome(null);
  };

  const pick = (key: string) => {
    setPicked(key);
    const chosen = grades[Number(key)];
    if (key === "" || !chosen) return;
    change({ n: String(chosen.grade.n), p2o5: String(chosen.grade.p2o5), k2o: String(chosen.grade.k2o) });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next = runForm(form);
    setOutcome(next);
    setSubmits((n) => n + 1);
    // Put the cursor on the first thing to fix. A grade error is about the three numbers
    // together, so it lands on the first of them.
    if (!next.ok) (fields.current[next.field === "grade" ? "n" : next.field])?.focus();
  };

  const failed = outcome && !outcome.ok ? outcome : null;
  const errorId = `${id}-error`;
  const flag = (field: FormField) =>
    failed && (failed.field === field || (failed.field === "grade" && field !== "target"))
      ? { "aria-invalid": true as const, "aria-describedby": errorId }
      : {};

  return (
    <section className="calculator panel" aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`} className="as-h3">
        {ui.calcHeading}
      </h2>

      <form onSubmit={submit} noValidate className="calc-form">
        <fieldset className="calc-fieldset">
          <legend>{ui.calcNutrient}</legend>
          <div className="calc-choices">
            {NUTRIENTS.map(({ id: nutrient, symbol }) => (
              <label key={nutrient} className="calc-choice">
                <input
                  type="radio"
                  name={`${id}-nutrient`}
                  checked={form.nutrient === nutrient}
                  onChange={() => change({ nutrient })}
                />
                <span lang="en">{symbol}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="calc-field">
          <label htmlFor={`${id}-target`}>{ui.calcTarget}</label>
          <input
            id={`${id}-target`}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            ref={(el) => {
              fields.current.target = el;
            }}
            value={form.target}
            onChange={(e) => change({ target: e.target.value })}
            {...flag("target")}
          />
        </div>

        <fieldset className="calc-fieldset">
          <legend>{ui.calcGrade}</legend>
          <div className="calc-field">
            <label htmlFor={`${id}-pick`}>{ui.calcPick}</label>
            <select id={`${id}-pick`} value={picked} onChange={(e) => pick(e.target.value)}>
              <option value="">{ui.calcCustom}</option>
              {grades.map((g, i) => (
                <option key={`${g.grade.n}-${g.grade.p2o5}-${g.grade.k2o}`} value={i}>
                  {`${g.grade.n}-${g.grade.p2o5}-${g.grade.k2o}`}
                  {g.name ? ` ${g.name}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="calc-grade-fields">
            {NUTRIENTS.map(({ id: nutrient, symbol }) => (
              <div key={nutrient} className="calc-field">
                <label htmlFor={`${id}-${nutrient}`}>
                  <span lang="en">{symbol} (%)</span>
                </label>
                <input
                  id={`${id}-${nutrient}`}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  ref={(el) => {
                    fields.current[nutrient] = el;
                  }}
                  value={form[nutrient]}
                  onChange={(e) => {
                    setPicked("");
                    change({ [nutrient]: e.target.value });
                  }}
                  {...flag(nutrient)}
                />
              </div>
            ))}
          </div>
        </fieldset>

        <button type="submit" className="primary">
          {ui.calcSubmit}
        </button>
      </form>

      <div id={errorId} role="alert" className={failed ? "note" : "visually-hidden"}>
        {failed ? <p key={submits}>{ui[ERROR_KEY[failed.error]]}</p> : null}
      </div>

      <div role="status" aria-live="polite" aria-atomic="true" className="calc-result">
        {outcome && outcome.ok ? <Result key={submits} outcome={outcome} ui={ui} /> : null}
      </div>
    </section>
  );
}

function Result({ outcome, ui }: { outcome: Extract<FormResult, { ok: true }>; ui: UiStrings }) {
  const { result } = outcome;
  const kg = formatNumber(result.roundedKg);
  return (
    <RateBlock ui={ui}>
      <p className="calc-answer">
        {ui.calcUse} <span className="num">≈ {kg}</span> {ui.calcKg} {ui.calcPerRai}
      </p>
      <p className="calc-line">
        <span className="num">{summaryLine(result)}</span> {ui.calcKg}
      </p>
      <h3 className="as-h3">{ui.calcWorking}</h3>
      <ol className="calc-steps">
        {workingLines(result).map((line) => (
          <li key={line} className="num">
            {line}
          </li>
        ))}
      </ol>
      <p className="muted">
        {ui.pamphletPages}: {CALCULATOR_SOURCE_PAGES.join(", ")}
      </p>
    </RateBlock>
  );
}
