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
  /** The p3 table's own heading and the source's "อาการขาดธาตุ" label; pinned to the raw page / chapter 1. */
  "colSymptom",
  "defTableCaption",
  /** Column headings and captions of the four fertilizer tables (T-019): the pamphlet's own words on p3, p4, p5 (captions are its section headings). */
  "colType",
  "colCharacterUse",
  "colFertilizer",
  "colGrade",
  "colCharacter",
  "colUseFor",
  "colMaterial",
  "colPurpose",
  "colEquivalence",
  "tableOrganicCaption",
  "tableStraightCaption",
  "tableCompoundCaption",
  "tableConditionersCaption",
  /** T-023: new UI Thai, shown on a block whose text the pamphlet prints no outside source for. */
  "sectionUncited",
  /** The quiz (T-021): all new UI Thai (the pamphlet prints answers after an arrow, with no such labels). */
  "quizShow",
  "quizHide",
  "quizAnswer",
  "quizRight",
  "quizAgain",
  "quizScore",
  "quizOf",
  "quizReset",
  /** The crop matcher (T-020). `cropBasal`, `cropTopDressing` and `cropRate` are the pamphlet's own words (p5, p3); pinned to the raw pages. */
  "cropLegend",
  "cropBasal",
  "cropTopDressing",
  "cropRate",
  "cropNoReliable",
  "cropDescriptiveHeading",
  /** The deficiency explorer (T-018). `defOld`, `defYoung` and the two rules are the source's own words. */
  "defLegend",
  "defOld",
  "defYoung",
  "defUnplaced",
  "defRuleOld",
  "defRuleYoung",
  "defRuleNone",
  "defSceneLabel",
  "defNo3d",
  /** The home redesign (T-027). New UI Thai copied verbatim from the design; see THAI-REVIEW.md U50-U66. */
  "homeTagline",
  "homeStart",
  "homeSeeAll",
  "homeCited",
  "homeDragHint",
  "homeChapterCount",
  "homeHere",
  "homeMacro",
  "homeSafeNote",
  "themeToDark",
  "themeToLight",
  "logoLabel",
  "homeTaglineShort",
  "homeChapterCountShort",
  "npkNameN",
  "npkNameP",
  "npkNameK",
  /** Chapter hero (T-028): "บทที่ 1" and "บทที่ 1 จาก 7" are built from these, copied from the Chapter-01 artboards. */
  "chapterBack",
  "chapterWord",
  "chapterFrom",
  "tierLegend",
  /** The source line under a block (T-029): "ที่มา …" and "และอีก 2 แหล่ง", copied from the Chapter-01 artboards. */
  "sourceLabel",
  "moreFrom",
  "moreUnit",
  /** The answer card's badge when the pamphlet gives no leaf position (T-030), from the Chapter-01 artboards. */
  "defBadgeNone",
  /** The flat plant's accessible name, when it stands in for the 3D one (T-032), from the Chapter-01 artboards. */
  "defFlatLabel",
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
