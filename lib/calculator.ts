import type { Npk } from "./data";

/**
 * The calculator (D10): pure arithmetic in the source's own form, oxide values
 * only. It takes a grade as printed on a bag — percent N, P₂O₅, K₂O — and never
 * converts between oxide and elemental form, which differ by ~2.3× for
 * phosphorus. There is no constant for that anywhere in this file, and a test
 * fails if one appears.
 *
 * Nothing here formats text. Steps are data, so the UI (T-014) can render them
 * in the locale's language, and every failure is a code, not a message.
 */

export const NUTRIENTS = ["n", "p2o5", "k2o"] as const;
export type Nutrient = (typeof NUTRIENTS)[number];

/** The pamphlet's constants: 1 ไร่ = 1,600 m² and 1 hectare = 6.25 ไร่ (p6). */
export const M2_PER_RAI = 1600;
export const RAI_PER_HECTARE = 6.25;

export type CalculationStep =
  | { readonly op: "multiply"; readonly a: number; readonly b: number; readonly result: number }
  | { readonly op: "divide"; readonly a: number; readonly b: number; readonly result: number }
  | { readonly op: "round"; readonly value: number; readonly result: number };

export type CalculationError =
  | "nutrient-unknown"
  | "target-invalid"
  | "grade-invalid"
  | "nutrient-zero"
  | "result-invalid"
  | "bag-invalid";

export type Failure = { readonly ok: false; readonly error: CalculationError };

export type ProductResult =
  | {
      readonly ok: true;
      readonly nutrient: Nutrient;
      readonly targetKgPerRai: number;
      /** Percent of the requested nutrient in the product. */
      readonly percent: number;
      /** Unrounded, for anything that goes on to compute with it. */
      readonly productKg: number;
      /** What to show: the source's whole-kg convention. */
      readonly roundedKg: number;
      readonly steps: readonly CalculationStep[];
    }
  | Failure;

export type BagResult =
  | { readonly ok: true; readonly nKg: number; readonly p2o5Kg: number; readonly k2oKg: number }
  | Failure;

/** `-0` passes every `>= 0` check and prints as "-0 kg"; adding 0 turns it into 0. */
const clean = (value: number): number => value + 0;

function isNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

/**
 * Each figure is a non-negative percent and the three together cannot exceed the
 * whole bag. The sum is what bounds each one at 100, so there is no separate check.
 */
function isValidGrade(grade: Npk): boolean {
  // The UI hands this parsed form state, so a missing grade is an answer, not a crash.
  if (typeof grade !== "object" || grade === null) return false;
  const parts = [grade.n, grade.p2o5, grade.k2o];
  return parts.every((p) => Number.isFinite(p) && p >= 0) && parts[0]! + parts[1]! + parts[2]! <= 100;
}

/**
 * Whole kg like the source ("≈ 22"), except that an amount under 1 kg keeps one
 * significant digit: rounding 0.04 kg to "0" would tell someone a real dose is
 * nothing.
 */
function roundKg(kg: number): number {
  if (kg === 0) return 0;
  return kg >= 1 ? Math.round(kg) : Number(kg.toPrecision(1));
}

/**
 * kg of product = target nutrient × 100 ÷ %nutrient (p6).
 *
 * "10 kg N per rai from urea 46-0-0" is 10 × 100 ÷ 46 ≈ 22 kg per rai.
 */
export function productFor(input: { nutrient: Nutrient; targetKgPerRai: number; grade: Npk }): ProductResult {
  const { nutrient, targetKgPerRai, grade } = input;
  if (!(NUTRIENTS as readonly string[]).includes(nutrient)) return { ok: false, error: "nutrient-unknown" };
  if (!isNonNegative(targetKgPerRai)) return { ok: false, error: "target-invalid" };
  if (!isValidGrade(grade)) return { ok: false, error: "grade-invalid" };

  const percent = grade[nutrient];
  if (percent === 0) return { ok: false, error: "nutrient-zero" };

  const target = clean(targetKgPerRai);
  const scaled = target * 100;
  const productKg = scaled / percent;
  if (!Number.isFinite(scaled) || !Number.isFinite(productKg)) return { ok: false, error: "result-invalid" };

  const roundedKg = roundKg(productKg);
  return {
    ok: true,
    nutrient,
    targetKgPerRai: target,
    percent,
    productKg,
    roundedKg,
    steps: [
      { op: "multiply", a: target, b: 100, result: scaled },
      { op: "divide", a: scaled, b: percent, result: productKg },
      { op: "round", value: productKg, result: roundedKg },
    ],
  };
}

/** What a bag holds: 50 kg of 16-20-0 is 8 kg N and 10 kg P₂O₅ (p6). */
export function nutrientsInBag(input: { bagKg: number; grade: Npk }): BagResult {
  const { bagKg, grade } = input;
  if (!isNonNegative(bagKg)) return { ok: false, error: "bag-invalid" };
  if (!isValidGrade(grade)) return { ok: false, error: "grade-invalid" };
  const nKg = clean((bagKg * grade.n) / 100);
  const p2o5Kg = clean((bagKg * grade.p2o5) / 100);
  const k2oKg = clean((bagKg * grade.k2o) / 100);
  if (![nKg, p2o5Kg, k2oKg].every(Number.isFinite)) return { ok: false, error: "result-invalid" };
  return { ok: true, nKg, p2o5Kg, k2oKg };
}

/** `null` rather than a number for a negative or non-finite input. */
export function hectareToRai(hectares: number): number | null {
  return isNonNegative(hectares) ? clean(hectares * RAI_PER_HECTARE) : null;
}

export function raiToHectare(rai: number): number | null {
  return isNonNegative(rai) ? clean(rai / RAI_PER_HECTARE) : null;
}

/** A rate per hectare covers 6.25 ไร่, so it is 6.25 times a rate per rai. */
export function kgPerRaiToKgPerHa(kgPerRai: number): number | null {
  return isNonNegative(kgPerRai) ? clean(kgPerRai * RAI_PER_HECTARE) : null;
}

export function kgPerHaToKgPerRai(kgPerHa: number): number | null {
  return isNonNegative(kgPerHa) ? clean(kgPerHa / RAI_PER_HECTARE) : null;
}
