import { productFor, roundKg, type Nutrient, type ProductResult } from "./calculator";
import type { Npk } from "./data";

/**
 * Turns what a person typed into a calculation, or into a precise reason it
 * cannot be one. Pure, so everything about the form's behaviour is testable
 * without a browser; the component only renders what this returns.
 *
 * Nothing here is Thai: an error is a code plus the field to flag, and the
 * words come from `content/th/ui.json` (D18).
 */

export interface FormState {
  readonly nutrient: Nutrient;
  readonly target: string;
  readonly n: string;
  readonly p2o5: string;
  readonly k2o: string;
}

export type FormErrorCode =
  | "target-empty"
  | "not-a-number"
  | "target-invalid"
  | "grade-empty"
  | "grade-invalid"
  | "nutrient-zero"
  | "result-invalid";

/** `grade` means the three percentages together (their sum), not one field. */
export type FormField = "target" | "n" | "p2o5" | "k2o" | "grade";

export type FormResult =
  | { readonly ok: true; readonly result: Extract<ProductResult, { ok: true }>; readonly grade: Npk }
  | { readonly ok: false; readonly error: FormErrorCode; readonly field: FormField };

const THAI_DIGITS = "๐๑๒๓๔๕๖๗๘๙";

/**
 * Plain decimals only. `Number()` would also accept "1e3", "0x10", "Infinity"
 * and " " (as 0), none of which is a quantity somebody meant to type. Thai
 * digits are accepted because a Thai keyboard produces them.
 */
export function parseDecimal(
  text: string,
): { readonly ok: true; readonly value: number } | { readonly ok: false; readonly reason: "empty" | "invalid" } {
  const trimmed = text.trim().replace(/[๐-๙]/gu, (d) => String(THAI_DIGITS.indexOf(d)));
  if (trimmed === "") return { ok: false, reason: "empty" };
  if (!/^-?(?:\d+\.?\d*|\.\d+)$/.test(trimmed)) return { ok: false, reason: "invalid" };
  return { ok: true, value: Number(trimmed) };
}

const GRADE_FIELDS = ["n", "p2o5", "k2o"] as const;

export function runForm(state: FormState): FormResult {
  const target = parseDecimal(state.target);
  if (!target.ok) {
    return { ok: false, error: target.reason === "empty" ? "target-empty" : "not-a-number", field: "target" };
  }
  // Digits all the way to infinity: a number, but too big to compute with.
  if (!Number.isFinite(target.value)) return { ok: false, error: "result-invalid", field: "target" };

  const percents: Record<(typeof GRADE_FIELDS)[number], number> = { n: 0, p2o5: 0, k2o: 0 };
  for (const field of GRADE_FIELDS) {
    const parsed = parseDecimal(state[field]);
    // A blank field is not 0%: that would quietly change which nutrient the bag has.
    if (!parsed.ok) {
      return { ok: false, error: parsed.reason === "empty" ? "grade-empty" : "not-a-number", field };
    }
    if (!Number.isFinite(parsed.value)) return { ok: false, error: "result-invalid", field };
    percents[field] = parsed.value;
  }
  const grade: Npk = { n: percents.n, p2o5: percents.p2o5, k2o: percents.k2o };

  const result = productFor({ nutrient: state.nutrient, targetKgPerRai: target.value, grade });
  if (result.ok) return { ok: true, result, grade };

  switch (result.error) {
    case "nutrient-zero":
      return { ok: false, error: "nutrient-zero", field: state.nutrient };
    case "grade-invalid":
      return { ok: false, error: "grade-invalid", field: "grade" };
    case "result-invalid":
      return { ok: false, error: "result-invalid", field: "target" };
    default:
      // target-invalid (negative or non-finite) and anything the form should never produce.
      return { ok: false, error: "target-invalid", field: "target" };
  }
}

const WHOLE = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const SMALL = new Intl.NumberFormat("en-US", { maximumFractionDigits: 10 });

/**
 * Arabic digits with thousands commas, like the source ("1,600"). Two decimals
 * from 1 up; under 1 two significant digits, so 0.0043 never shows as "0".
 */
export function formatNumber(value: number): string {
  const x = value + 0; // -0 → 0
  if (x !== 0 && Math.abs(x) < 1) return SMALL.format(Number(x.toPrecision(2)));
  return WHOLE.format(x);
}

const EXACT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 10 });

/** Float noise off (10.005 × 100 is 1000.4999999999999), commas on, no rounding to speak of. */
function exact(value: number): string {
  return EXACT.format(Number((value + 0).toPrecision(12)));
}

/**
 * The quotient as printed in the working. A quotient that terminates ("2,249.9 ÷
 * 100 = 22.499") is printed in full; one that does not ("1,000 ÷ 46") gets two
 * decimals, or more only if two would make the last step contradict itself.
 * Anything else shows a line like "22.5 ≈ 22" that reads as a rounding error.
 */
function quotientText(quotient: number, roundedKg: number): string {
  const clean = Number(quotient.toPrecision(12));
  // Six places is far more than a quotient of two typed numbers needs to terminate in;
  // past that, a long expansion is a repeating one (1,000 ÷ 46), not an exact answer.
  for (let d = 0; d <= 6; d++) {
    if (Math.abs(clean - Number(clean.toFixed(d))) < 1e-12 * Math.max(1, Math.abs(clean))) {
      return new Intl.NumberFormat("en-US", { maximumFractionDigits: Math.max(d, 0) }).format(clean);
    }
  }
  for (let d = 2; d <= 10; d++) {
    if (roundKg(Number(quotient.toFixed(d))) === roundedKg || d === 10) {
      return new Intl.NumberFormat("en-US", { maximumFractionDigits: d, minimumFractionDigits: d }).format(quotient);
    }
  }
  return exact(quotient);
}

type Solved = Extract<ProductResult, { ok: true }>;

/** One line per step, in the source's own form. Inputs are printed exactly as typed. */
export function workingLines(result: Solved): readonly string[] {
  const quotient = quotientText(result.productKg, result.roundedKg);
  return result.steps.map((step) => {
    switch (step.op) {
      case "multiply":
        return `${exact(step.a)} × ${exact(step.b)} = ${exact(step.result)}`;
      case "divide":
        return `${exact(step.a)} ÷ ${exact(step.b)} = ${quotient}`;
      case "round":
        return `${quotient} ≈ ${formatNumber(step.result)}`;
    }
  });
}

/** The source's one-line form: "10 × 100 ÷ 46 ≈ 22". */
export function summaryLine(result: Solved): string {
  return `${exact(result.targetKgPerRai)} × 100 ÷ ${exact(result.percent)} ≈ ${formatNumber(result.roundedKg)}`;
}
