import { cropChoices, type SourceChip } from "./crop-matcher";

/**
 * The basal vs top dressing diagram's content (T-022). Four lines of the pamphlet (§2.7,
 * p5) are all the timing it gives, so this is a labelled picture, not a timeline: no time
 * scale, no durations, no stages the source does not name. Every phrase is the pamphlet's
 * own, split into lines only at its own spaces; the test pins each to the raw page and to
 * chapter 2's bullets. The Thai rates come from the data (p12), never typed here.
 */
export interface Stage {
  readonly id: "basal" | "topDressing";
  readonly term: string;
  /** The pamphlet's sentence, in the lines it breaks into at its own spaces. */
  readonly lines: readonly string[];
}

export const STAGES: readonly Stage[] = [
  { id: "basal", term: "ปุ๋ยรองพื้น", lines: ["ใส่ก่อนหรือพร้อมปลูก", "เน้น P และ K", "เช่น 16-20-0 หรือปุ๋ยคอก"] },
  { id: "topDressing", term: "ปุ๋ยแต่งหน้า", lines: ["ใส่ระหว่างที่พืชเติบโต", "เน้น N และแบ่งใส่หลายครั้ง", "เช่น ยูเรียตอนข้าวแตกกอหรือตั้งท้อง"] },
];

/** Where §2.7 is. */
export const SECTION_PAGE = 5;

export interface RateLine {
  /** The p12 row, in the table's own words (`ข้าว ดินเหนียว`). */
  readonly label: string;
  readonly grades: string;
  /** `20–25`: the data's range, source's en dash. */
  readonly rate: string;
  /** As the table writes it. */
  readonly unit: string;
  readonly sources: readonly SourceChip[];
  readonly page: number;
}

/**
 * The Thai rice rates, for the stage each applies to. Only guidance the data layer
 * marks actionable and gives a per-area number for can appear here (D9), so the figures
 * quoted in the ticket (basal 20–25 kg/rai, urea 5–10 kg/rai) are whatever the data says
 * and a changed or demoted row changes the diagram with it.
 */
export function riceRates(locale: string): Record<Stage["id"], readonly RateLine[]> {
  const rice = cropChoices(locale).find((c) => c.id === "rice");
  const out: Record<Stage["id"], RateLine[]> = { basal: [], topDressing: [] };
  for (const row of rice?.rows ?? []) {
    for (const stage of row.stages) {
      for (const g of stage.actionable) {
        if (g.scope !== "TH" || g.rate === null || g.unit === null) continue;
        out[stage.stage].push({
          label: row.label,
          grades: g.grades.join(" / "),
          rate: g.rate,
          unit: g.unit,
          sources: g.sources,
          page: row.sourcePage,
        });
      }
    }
  }
  return out;
}
