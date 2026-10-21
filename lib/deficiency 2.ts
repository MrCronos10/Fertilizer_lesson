import { deficiencyRows, showsFirstOn } from "./data";

/**
 * The deficiency explorer's content (T-018). Nothing is written for the site: each row
 * is the pamphlet's own p3 line, and which leaves it sits under follows the source's
 * mobility sentence (mobile → old leaves, immobile → young leaves). Two rows, Zn and
 * Cu / Mo, are not placed by the source, so they get a group of their own rather than
 * a guess.
 */
export type LeafGroupId = "old" | "young" | "unplaced";

export interface DeficiencyEntry {
  readonly id: string;
  /** As the source prints it, e.g. "Fe / Mn". */
  readonly elements: string;
  readonly symptom: string;
  readonly sourcePage: number;
}

export interface LeafGroup {
  readonly id: LeafGroupId;
  readonly entries: readonly DeficiencyEntry[];
}

/** The mobility sentence (old vs young leaves) is on p2; the symptom lines it sorts are on p3. */
export const RULE_PAGE = 2;

export const LEAF_GROUP_ORDER: readonly LeafGroupId[] = ["old", "young", "unplaced"];

const GROUP_OF = { "old-leaves": "old", "young-leaves": "young" } as const;

export function deficiencyGroups(): readonly LeafGroup[] {
  const buckets: Record<LeafGroupId, DeficiencyEntry[]> = { old: [], young: [], unplaced: [] };
  for (const row of deficiencyRows()) {
    const placed = showsFirstOn(row);
    buckets[placed ? GROUP_OF[placed] : "unplaced"].push({
      id: row.id,
      elements: row.elements.join(" / "),
      symptom: row.labels.th.symptom,
      sourcePage: row.sourcePage,
    });
  }
  return LEAF_GROUP_ORDER.map((id) => ({ id, entries: buckets[id] }));
}
