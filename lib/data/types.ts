/**
 * Types for the nine tables extracted from the source (T-006).
 *
 * Two rules shape every type here:
 *
 * 1. **Oxide form only.** A fertilizer grade's second and third numbers are
 *    percent P₂O₅ and percent K₂O, not percent P and percent K. The elemental
 *    figures are ~2.3× and ~1.2× smaller. There is therefore no `p` or `k` key
 *    anywhere in this file, and a test scans the JSON for one.
 * 2. **Numbers are locale-neutral; only labels are translated** (D18). A rate
 *    cannot drift between Thai and Khmer if there is only one copy of it.
 *
 * Anything the source does not state is `null`, never a guess.
 */

export const COUNTRIES = ["TH", "KH"] as const;
export type Country = (typeof COUNTRIES)[number];

/**
 * Whose guidance a piece of advice is.
 *
 * `REGIONAL` is advice the source itself presents as regional (CIAT).
 * `UNSTATED` is advice printed in the shared table with **no country
 * attribution at all** — the vegetable row is the only case, and its sole
 * citation is a Cambodian survey. Calling that `TH` would assert a Thai
 * provenance the source never gives, so it gets its own value and T-007
 * decides whether it is actionable.
 */
export type Scope = Country | "REGIONAL" | "UNSTATED";

export type Locale = "th" | "en" | "km" | "zh";

/** A nutrient grade as printed on a bag: **percent** N, P₂O₅, K₂O. */
export interface Npk {
  readonly n: number;
  readonly p2o5: number;
  readonly k2o: number;
}

/**
 * The same three nutrients as an **absolute amount in kg/ha**, not a percent.
 *
 * The field names differ from `Npk` on purpose, so the two are not assignable
 * to each other and `formatGrade` cannot be handed one by mistake. The p11
 * table prints "118-23-0" meaning 118 kg N per hectare; rendering that as a
 * bag grade would tell a grower to buy a fertilizer that cannot exist, and a
 * mere type alias would not have stopped it.
 */
export interface NpkKgPerHa {
  readonly nKg: number;
  readonly p2o5Kg: number;
  readonly k2oKg: number;
}

/** A closed numeric interval. The source writes these as "25–50"; we do not. */
export interface Range {
  readonly min: number;
  readonly max: number;
}

export type Quantity = { readonly value: number } | Range;

export function isRange(quantity: Quantity): quantity is Range {
  return "min" in quantity;
}

export interface Row {
  readonly id: string;
  /** Page of the source PDF this row was read from. */
  readonly sourcePage: number;
  /**
   * Whose guidance this row is. `NEUTRAL` means the row is not
   * country-specific — plant chemistry, a bag grade, a glossary term — rather
   * than that its country is unknown.
   */
  readonly country: Country | "NEUTRAL";
  /** Citation markers the source prints against this row, if any. */
  readonly citations?: readonly string[];
  /**
   * How many further sources an overflow pill stands for. The source prints
   * `uga +2` and `cgiar +3`; those extra sources are named nowhere in the
   * document and have no link annotation, so only the count survives.
   */
  readonly citationsMore?: number;
}

/* ------------------------------------------------------------------ p2 */

export type NutrientGroupId = "macronutrients" | "secondary" | "micronutrients";

export interface NutrientGroupRow extends Row {
  readonly id: NutrientGroupId;
  readonly elements: readonly string[];
  readonly labels: { readonly th: { readonly group: string; readonly role: string } };
}

/* ------------------------------------------------------------------ p3 */

/**
 * Which leaves show a deficiency first. The source gives this as a rule over
 * two explicit lists (p2); elements in neither list are `null`, because the
 * source does not place them.
 */
export type Mobility = "mobile" | "immobile";

export interface DeficiencyRow extends Row {
  readonly elements: readonly string[];
  readonly mobility: Mobility | null;
  readonly labels: { readonly th: { readonly symptom: string } };
}

export interface OrganicFertilizerRow extends Row {
  readonly npk: Npk;
  /**
   * `npk` as the pamphlet prints it. A JSON number cannot keep a trailing zero, and the
   * source prints compost as `1.5-0.4-1.0`; the page must not quietly show `1.5-0.4-1`.
   */
  readonly labels: { readonly th: { readonly name: string; readonly npkText: string; readonly note: string } };
}

/* ------------------------------------------------------------------ p4 */

export interface StraightFertilizerRow extends Row {
  /** `null` for rock phosphate, which the source gives no grade for. */
  readonly grade: Npk | null;
  /** Percent sulphur, where the source states it. */
  readonly sulphurPercent: number | null;
  readonly labels: {
    readonly th: {
      readonly name: string;
      readonly grade: string;
      readonly character: string;
      readonly useFor: string;
    };
  };
}

/* ------------------------------------------------------------------ p5 */

export interface CompoundGradeRow extends Row {
  readonly grades: readonly Npk[];
  readonly labels: { readonly th: { readonly useFor: string } };
}

export interface SoilConditionerRow extends Row {
  /** Quantity relative to ground limestone. `null` for gypsum, which has none. */
  readonly limeEquivalence: number | null;
  readonly labels: {
    readonly th: { readonly name: string; readonly purpose: string; readonly equivalence: string };
  };
}

/* ----------------------------------------------------------------- p11 */

/** Kilograms of each straight fertilizer per hectare. */
export interface StraightRateKgPerHa {
  readonly urea: number;
  readonly dap: number;
  readonly kcl: number;
}

export interface RiceSoilGroupRow extends Row {
  readonly country: "KH";
  /** A qualifier the source attaches to the rate, not to the soil name. */
  readonly rateNote: string | null;
  readonly perHectare: StraightRateKgPerHa;
  /** The resulting nutrient supply in kg/ha. `null` for the "unknown soil" row. */
  readonly suppliesNpkKgPerHa: NpkKgPerHa | null;
  /** Soil names in the source's own Latin transliteration; see the file note. */
  readonly labels: { readonly en: { readonly soil: string } };
}

/* -------------------------------------------------------------- p12–13 */

export type RateUnit = "kg/rai" | "kg/ha" | "kg/tree" | "kg/rai/yr";

/**
 * One piece of advice for one crop. `scope` says whose guidance it is, which
 * is what keeps Cambodian survey figures out of the Thai UI even when they sit
 * in the same table row as Thai ones.
 */
export interface Guidance {
  readonly scope: Scope;
  readonly grades: readonly Npk[];
  readonly rate: Quantity | null;
  readonly unit: RateUnit | null;
  /** Citation markers the page prints against *this* guidance (not the row). */
  readonly citations: readonly string[];
  /** Sources the cell names for this guidance without linking; ids in sources.json. */
  readonly namedSources: readonly string[];
  /**
   * Whether this may feed the calculator or crop matcher (D9). False for
   * guidance with no country attribution, for Cambodian guidance, and for
   * guidance whose only backing is commercial. Derived by `isActionable` in
   * lib/sources.ts; a test asserts the stored value agrees.
   */
  readonly actionable: boolean;
  /** The source's own wording, verbatim and untranslated. */
  readonly text: string;
}

export interface CropRow extends Row {
  readonly basal: readonly Guidance[];
  readonly topDressing: readonly Guidance[];
  readonly labels: { readonly th: { readonly crop: string } };
  readonly sourceNote: string;
}

/* ----------------------------------------------------------------- p14 */

/**
 * Khmer is deliberately absent: the source's Khmer text layer loses subscript
 * consonants and vowel signs, and transcribing it by eye from a page image is
 * not something this extraction can verify. See SOURCES.md.
 */
export interface GlossaryRow extends Row {
  readonly labels: {
    readonly th: string;
    readonly en: string;
    readonly zh: string;
  };
}

/* ---------------------------------------------------------------- file */

export interface Table<T extends Row> {
  readonly id: string;
  readonly sourcePages: readonly number[];
  readonly rowCount: number;
  readonly rows: readonly T[];
}
