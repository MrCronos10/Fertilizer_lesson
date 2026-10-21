import { citationEntry } from "./citations";
import { readChapters } from "./content";
import { cropsForReading, formatGrade, formatQuantity, type Guidance, type RateUnit, type Scope } from "./data";
import { namedSourceFor, type Tier } from "./sources";

/**
 * The crop matcher's content (T-020), built from the p12–13 table through the
 * audience filter. Nothing here is written for the site.
 *
 * The one door in is `cropsForReading`, which already drops Cambodian guidance;
 * each piece of guidance is then sorted by the `actionable` flag the data layer
 * derived from its sources (D9). Actionable guidance is shown as numbers. The rest
 * is shown only as the source's own text, so a figure backed by commercial sources
 * alone, or by no stated country, never looks like a recommendation. Which crops
 * have any actionable guidance is *derived*, never listed, so the "no reliable
 * source" state follows the data rather than a hand-kept list of crop names.
 */

export type CropId = "rice" | "maize" | "cassava" | "sugarcane" | "rubber" | "mango" | "durian" | "vegetables";

/** The eight crops the lesson offers, and the p12–13 rows each one covers. */
export const CROP_GROUPS: readonly { id: CropId; label: string; rows: readonly string[] }[] = [
  { id: "rice", label: "ข้าว", rows: ["rice-clay", "rice-sandy"] },
  { id: "maize", label: "ข้าวโพด", rows: ["maize"] },
  { id: "cassava", label: "มันสำปะหลัง", rows: ["cassava"] },
  { id: "sugarcane", label: "อ้อย", rows: ["sugarcane"] },
  { id: "rubber", label: "ยางพารา", rows: ["rubber-immature", "rubber-tapped"] },
  { id: "mango", label: "มะม่วง", rows: ["mango"] },
  { id: "durian", label: "ทุเรียน", rows: ["durian"] },
  { id: "vegetables", label: "ผัก", rows: ["vegetables"] },
];

export interface SourceChip {
  readonly id: string;
  readonly name: string;
  readonly tier: Tier;
  /** Sources hidden behind an overflow pill: counted, never named. */
  readonly unnamed: number;
  /**
   * Whether the chapter's sources list has an entry to link to. Named-only sources have
   * none, and neither has a marker the chapter's own pages do not print (the dolomite
   * rate's `blogspot` is printed on p5, not p12–13): those show name and tier, unlinked.
   */
  readonly linked: boolean;
}

export interface GuidanceView {
  readonly key: string;
  /** The source's own wording, verbatim and untranslated. */
  readonly text: string;
  readonly scope: Scope;
  /** Grades as a bag prints them. Empty for guidance with none. */
  readonly grades: readonly string[];
  /** `20–25` or `1`, with the source's en dash; `null` where the source gives no number. */
  readonly rate: string | null;
  /** The unit exactly as the source writes it (`kg/rai`, `kg/ha`, `kg/tree`, `kg/rai/yr`). */
  readonly unit: RateUnit | null;
  readonly sources: readonly SourceChip[];
}

export interface StageView {
  readonly stage: "basal" | "topDressing";
  readonly actionable: readonly GuidanceView[];
  readonly descriptive: readonly GuidanceView[];
}

export interface RowView {
  readonly id: string;
  readonly label: string;
  readonly sourcePage: number;
  /** The table's own Source cell, verbatim. */
  readonly sourceNote: string;
  readonly stages: readonly StageView[];
  readonly hasActionable: boolean;
}

export interface CropView {
  readonly id: CropId;
  readonly label: string;
  readonly rows: readonly RowView[];
  /** True when at least one piece of guidance may be acted on. */
  readonly reliable: boolean;
}

function view(g: Guidance, key: string, listed: ReadonlySet<string>): GuidanceView {
  const sources: SourceChip[] = [
    ...g.citations.map((id) => {
      const entry = citationEntry(id);
      return { id, name: entry.name, tier: entry.tier, unnamed: entry.unnamed, linked: listed.has(id) };
    }),
    ...g.namedSources.map((id) => {
      const named = namedSourceFor(id);
      if (!named) throw new Error(`named source "${id}" has no entry in sources.json`);
      return { id, name: named.name, tier: named.tier, unnamed: 0, linked: false };
    }),
  ];
  return {
    key,
    text: g.text,
    scope: g.scope,
    grades: g.grades.map(formatGrade),
    rate: g.rate ? formatQuantity(g.rate) : null,
    unit: g.unit,
    sources,
  };
}

/** The chapter that shows the matcher; its frontmatter says which markers its sources list has. */
const CHAPTER = 5;

export function cropChoices(locale: string): readonly CropView[] {
  const chapter = readChapters(locale).find((c) => c.frontmatter.chapter === CHAPTER);
  if (!chapter) throw new Error(`chapter ${CHAPTER} (the crop matcher's) is missing`);
  const listed = new Set(chapter.frontmatter.citations);
  const byId = new Map(cropsForReading(locale).map((c) => [c.row.id, c]));
  const claimed = CROP_GROUPS.flatMap((g) => g.rows);
  for (const id of byId.keys()) {
    if (!claimed.includes(id)) throw new Error(`crop row "${id}" is in no crop group, so it could never be chosen`);
  }

  return CROP_GROUPS.map((group) => {
    const rows = group.rows.map((rowId): RowView => {
      const crop = byId.get(rowId);
      if (!crop) throw new Error(`crop row "${rowId}" is missing from the table`);
      const stages = (["basal", "topDressing"] as const)
        .map((stage): StageView => {
          const all = crop[stage].map((g, i) => ({ g, key: `${rowId}-${stage}-${i}` }));
          return {
            stage,
            actionable: all.filter((x) => x.g.actionable).map((x) => view(x.g, x.key, listed)),
            descriptive: all.filter((x) => !x.g.actionable).map((x) => view(x.g, x.key, listed)),
          };
        })
        .filter((s) => s.actionable.length + s.descriptive.length > 0);
      return {
        id: rowId,
        label: crop.row.labels.th.crop,
        sourcePage: crop.row.sourcePage,
        sourceNote: crop.row.sourceNote,
        stages,
        hasActionable: stages.some((s) => s.actionable.length > 0),
      };
    });
    return { id: group.id, label: group.label, rows, reliable: rows.some((r) => r.hasActionable) };
  });
}
