/**
 * The `nums` teaching device (D12a): each chapter lists the figures it relies
 * on, each with its citation. Every `text` is a stretch of the source's own
 * wording, not a paraphrase; `lib/nums.test.ts` pins each to the raw page it
 * came from, so a figure cannot be reworded or moved to another chapter.
 */
export interface Num {
  readonly text: string;
  readonly sourcePage: number;
  /** Citation marker as printed beside it; resolved through `citationEntry`. */
  readonly cite: string;
  /** Sources hidden behind an overflow pill. */
  readonly more?: number;
}

export const NUMS: Readonly<Record<number, readonly Num[]>> = {
  1: [
    { text: "พ.ร.บ.ปุ๋ย พ.ศ. 2518", sourcePage: 2, cite: "doa" },
    { text: "ธาตุที่เคลื่อนที่ได้ในพืช (N, P, K, Mg) แสดงอาการที่ ใบแก่ ก่อน", sourcePage: 2, cite: "uga", more: 2 },
    { text: "ธาตุที่เคลื่อนที่ไม่ได้ (Fe, Ca, B, S, Mn) แสดงอาการที่ ใบอ่อน/ยอด ก่อน", sourcePage: 2, cite: "uga", more: 2 },
  ],
};

export function numsFor(chapter: number): readonly Num[] {
  return NUMS[chapter] ?? [];
}
