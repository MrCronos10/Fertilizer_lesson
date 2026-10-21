import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CONTENT_ROOT } from "./content";
import type { Locale } from "./locales";

/**
 * Interface strings (nav, skip link). Kept beside the chapter prose so no Thai
 * is hard-coded in a component (D18). Every string here is new Thai written
 * for the UI, not quoted from the source, so each is listed for the owner in
 * `docs/content/THAI-REVIEW.md` (D6).
 */
export const UI_KEYS = [
  "siteTitle",
  "skipToContent",
  "contents",
  "chapterNav",
  "previousChapter",
  "nextChapter",
  "sources",
  "jumpToSources",
  "tierLabel",
  "tierOfficial",
  "tierResearch",
  "tierCommercial",
  "pamphletPages",
  "unnamedSources",
  "noLink",
  /** The source's own p3 sentence, not new UI Thai; `lib/citations.test.ts` pins it to the raw page. */
  "soilTestNote",
  /** Column headings of the p2 table, in the source's own words; pinned to the raw page. */
  "colGroup",
  "colElements",
  "colRole",
  "nutrientGroupsCaption",
  "numsHeading",
  /** The calculator (T-014). `calcUse` and `calcKg` are the source's own words (p6). */
  "calcHeading",
  "calcNutrient",
  "calcTarget",
  "calcGrade",
  "calcPick",
  "calcCustom",
  "calcSubmit",
  "calcUse",
  "calcKg",
  "calcPerRai",
  "calcWorking",
  "calcErrTargetEmpty",
  "calcErrNotNumber",
  "calcErrTargetInvalid",
  "calcErrGradeEmpty",
  "calcErrGradeInvalid",
  "calcErrNutrientZero",
  "calcErrResult",
  /** The bag reader (T-015): all four are the pamphlet's own words (p6), pinned to the raw page. */
  "bagLegend",
  "bagWord",
  "bagHas",
  "bagNone",
  "bagPercent",
] as const;

export type UiStrings = Readonly<Record<(typeof UI_KEYS)[number], string>>;

export function parseUiStrings(file: string, raw: string): UiStrings {
  const value: unknown = JSON.parse(raw);
  if (typeof value !== "object" || value === null) throw new Error(`${file}: not an object`);
  const record = value as Record<string, unknown>;
  for (const key of UI_KEYS) {
    const v = record[key];
    if (typeof v !== "string" || v.trim() === "") throw new Error(`${file}: ${key} must be a non-empty string`);
  }
  const extra = Object.keys(record).filter((k) => !(UI_KEYS as readonly string[]).includes(k));
  if (extra.length > 0) throw new Error(`${file}: unknown key ${extra.join(", ")}`);
  return record as unknown as UiStrings;
}

export function readUiStrings(locale: Locale): UiStrings {
  const file = join(CONTENT_ROOT, locale, "ui.json");
  return parseUiStrings(file, readFileSync(file, "utf8"));
}
