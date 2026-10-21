import { nutrientsInBag, type Nutrient } from "./calculator";
import { nutrientGroupRows } from "./data";

/**
 * The bag reader's content (T-015). Nothing here is written for the site: the bag
 * is the pamphlet's own worked example (p6), each nutrient's explanation is its
 * p2 table wording, and the amounts are what the calculator works out for that
 * bag, which `lib/bag-reader.test.ts` checks against the pamphlet's "N 8 กก.,
 * P₂O₅ 10 กก.".
 */
export const BAG = { weightKg: 50, grade: { n: 16, p2o5: 20, k2o: 0 } } as const;

export interface BagTile {
  readonly id: Nutrient;
  /** As a bag prints it: oxide form. */
  readonly symbol: "N" | "P₂O₅" | "K₂O";
  /** Percent of the bag's weight; this is the number printed on the bag. */
  readonly percent: number;
  /** The p2 table's wording for the nutrient, e.g. "N = ใบเขียว โตเร็ว". */
  readonly role: string;
  /** Kilograms of the nutrient in the whole bag. */
  readonly amountKg: number;
}

const ORDER = [
  { id: "n", symbol: "N", element: "N" },
  { id: "p2o5", symbol: "P₂O₅", element: "P" },
  { id: "k2o", symbol: "K₂O", element: "K" },
] as const;

export function bagTiles(): readonly BagTile[] {
  const macro = nutrientGroupRows().find((r) => r.id === "macronutrients");
  if (!macro) throw new Error("the p2 macronutrient row is missing");
  // "N = …; P = …; K = …" — one clause per nutrient, in the source's order.
  const roles = new Map(macro.labels.th.role.split(/;\s*/).map((clause) => [clause.charAt(0), clause.trim()]));

  const inBag = nutrientsInBag({ bagKg: BAG.weightKg, grade: BAG.grade });
  if (!inBag.ok) throw new Error(`the pamphlet's own bag failed to compute: ${inBag.error}`);
  const amount = { n: inBag.nKg, p2o5: inBag.p2o5Kg, k2o: inBag.k2oKg } as const;

  return ORDER.map(({ id, symbol, element }) => {
    const role = roles.get(element);
    if (!role) throw new Error(`no p2 wording for ${element}`);
    return { id, symbol, percent: BAG.grade[id], role, amountKg: amount[id] };
  });
}
