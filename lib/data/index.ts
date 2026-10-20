import compoundGradesJson from "@/content/data/compound-grades.json";
import deficiencySymptomsJson from "@/content/data/deficiency-symptoms.json";
import glossaryJson from "@/content/data/glossary.json";
import nutrientGroupsJson from "@/content/data/nutrient-groups.json";
import organicFertilizerNpkJson from "@/content/data/organic-fertilizer-npk.json";
import otherCropsJson from "@/content/data/other-crops.json";
import riceBySoilGroupKhJson from "@/content/data/rice-by-soil-group-kh.json";
import soilConditionersJson from "@/content/data/soil-conditioners.json";
import straightFertilizersJson from "@/content/data/straight-fertilizers.json";

import type {
  CompoundGradeRow,
  Country,
  CropRow,
  DeficiencyRow,
  GlossaryRow,
  Guidance,
  Npk,
  NutrientGroupRow,
  OrganicFertilizerRow,
  Quantity,
  RiceSoilGroupRow,
  SoilConditionerRow,
  StraightFertilizerRow,
  Table,
} from "./types";

import { isRange } from "./types";

/**
 * The nine source tables (T-006), imported as JSON so the numbers are
 * statically analysable and bundled.
 *
 * The casts below are assertions, not checks — TypeScript will not notice a
 * missing or mistyped field in a JSON file. `assertTables()` does that at
 * runtime and the test suite calls it, so the shapes are enforced somewhere
 * real rather than merely asserted here.
 */

/**
 * Every row of every table, **unfiltered by country**.
 *
 * Read this only from tests and tooling. Rendering from it bypasses the
 * country rules and will put Cambodian soil-group rates in front of a Thai
 * grower; the query functions below are the supported path, and they are named
 * so that a component reaching past them is visible in review.
 */
export const RAW_TABLES = {
  "nutrient-groups": nutrientGroupsJson as Table<NutrientGroupRow>,
  "deficiency-symptoms": deficiencySymptomsJson as Table<DeficiencyRow>,
  "organic-fertilizer-npk": organicFertilizerNpkJson as Table<OrganicFertilizerRow>,
  "straight-fertilizers": straightFertilizersJson as Table<StraightFertilizerRow>,
  "compound-grades": compoundGradesJson as Table<CompoundGradeRow>,
  "soil-conditioners": soilConditionersJson as unknown as Table<SoilConditionerRow>,
  "rice-by-soil-group-kh": riceBySoilGroupKhJson as unknown as Table<RiceSoilGroupRow>,
  "other-crops": otherCropsJson as unknown as Table<CropRow>,
  glossary: glossaryJson as Table<GlossaryRow>,
} as const;

export type TableId = keyof typeof RAW_TABLES;

export const TABLE_IDS = Object.keys(RAW_TABLES) as TableId[];

/**
 * Which country's guidance a locale is allowed to see.
 *
 * v1 ships Thai only. The p11 rice table is Cambodian throughout, and the
 * shared crop table mixes Cambodian and regional figures into rows alongside
 * Thai ones, so this has to be enforced at the query layer rather than per
 * file. Showing a Cambodian soil-group rate to a Thai grower would be
 * confidently wrong advice, which is worse than no advice.
 */
const AUDIENCE: Record<string, Country> = { th: "TH", km: "KH" };

export function audienceFor(locale: string): Country {
  const country = AUDIENCE[locale];
  if (!country) throw new Error(`no audience country defined for locale "${locale}"`);
  return country;
}

/** A row is visible to an audience if it is theirs or not country-specific. */
function visibleToAudience<T extends { readonly country: Country | "NEUTRAL" }>(
  rows: readonly T[],
  audience: Country,
): readonly T[] {
  return rows.filter((row) => row.country === audience || row.country === "NEUTRAL");
}

/* -------------------------------------------------------------- queries */

export function nutrientGroupRows(): readonly NutrientGroupRow[] {
  return RAW_TABLES["nutrient-groups"].rows;
}

export function deficiencyRows(): readonly DeficiencyRow[] {
  return RAW_TABLES["deficiency-symptoms"].rows;
}

/** The leaves a deficiency shows on first, or `null` where the source is silent. */
export function showsFirstOn(row: DeficiencyRow): "old-leaves" | "young-leaves" | null {
  if (row.mobility === "mobile") return "old-leaves";
  if (row.mobility === "immobile") return "young-leaves";
  return null;
}

export function organicFertilizers(locale: string): readonly OrganicFertilizerRow[] {
  return visibleToAudience(RAW_TABLES["organic-fertilizer-npk"].rows, audienceFor(locale));
}

export function straightFertilizers(): readonly StraightFertilizerRow[] {
  return RAW_TABLES["straight-fertilizers"].rows;
}

export function compoundGradeRows(): readonly CompoundGradeRow[] {
  return RAW_TABLES["compound-grades"].rows;
}

export function soilConditioners(): readonly SoilConditionerRow[] {
  return RAW_TABLES["soil-conditioners"].rows;
}

export function glossaryRows(): readonly GlossaryRow[] {
  return RAW_TABLES.glossary.rows;
}

/**
 * Cambodian rice by soil group. Returns nothing for a Thai audience, which is
 * every audience in v1 — the table is kept so the data is not lost, not so it
 * can be shown.
 */
export function riceSoilGroups(locale: string): readonly RiceSoilGroupRow[] {
  return visibleToAudience(RAW_TABLES["rice-by-soil-group-kh"].rows, audienceFor(locale));
}

/** Guidance a given audience may see: its own country's, plus unattributed. */
function visibleGuidance(guidance: readonly Guidance[], audience: Country): readonly Guidance[] {
  return guidance.filter((g) => g.scope === audience || g.scope === "REGIONAL" || g.scope === "UNSTATED");
}

/**
 * A crop with its guidance already filtered.
 *
 * `row` deliberately has `basal` and `topDressing` removed. Keeping them would
 * put an unfiltered `crop.row.topDressing` one property access away from the
 * filtered `crop.topDressing`, with the same name and no type-level
 * difference — which is exactly how a Cambodian rate reaches a Thai page.
 */
export interface CropMatch {
  readonly row: Omit<CropRow, "basal" | "topDressing">;
  readonly basal: readonly Guidance[];
  readonly topDressing: readonly Guidance[];
}

export function cropsFor(locale: string): readonly CropMatch[] {
  const audience = audienceFor(locale);
  return visibleToAudience(RAW_TABLES["other-crops"].rows, audience).map((row) => {
    const { basal, topDressing, ...rest } = row;
    return {
      row: rest,
      basal: visibleGuidance(basal, audience),
      topDressing: visibleGuidance(topDressing, audience),
    };
  });
}

/* ------------------------------------------------------------ formatting */

/**
 * Renders a percentage grade the way a bag prints it: 16-20-0.
 *
 * Takes `Npk` only. `NpkKgPerHa` has different field names precisely so that
 * a kg/ha supply figure cannot reach this function.
 */
export function formatGrade({ n, p2o5, k2o }: Npk): string {
  return `${n}-${p2o5}-${k2o}`;
}

/** Renders a quantity with the source's en dash for ranges. */
export function formatQuantity(quantity: Quantity): string {
  return isRange(quantity) ? `${quantity.min}–${quantity.max}` : `${quantity.value}`;
}

export * from "./types";
export { assertTables } from "./validate";
