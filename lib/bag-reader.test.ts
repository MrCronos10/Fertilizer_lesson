import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BAG, bagTiles } from "./bag-reader";
import { textStream } from "./content";
import { readUiStrings } from "./ui";

const ui = readUiStrings("th");
const raw = (n: number) => readFileSync(join(process.cwd(), `docs/content/raw/p${String(n).padStart(2, "0")}.txt`), "utf8");

describe("the bag is the pamphlet's own example", () => {
  it("is 16-20-0 in a 50 kg bag, as printed on p6", () => {
    expect(BAG).toEqual({ weightKg: 50, grade: { n: 16, p2o5: 20, k2o: 0 } });
    expect(textStream(raw(6))).toContain(textStream("ตัวอย่างเช่น 16-20-0 กระสอบ 50 กก."));
  });
});

describe("the three tiles", () => {
  const tiles = bagTiles();

  it("are N, P₂O₅ and K₂O in the order a bag prints them, with the bag's percentages", () => {
    expect(tiles.map((t) => [t.id, t.symbol, t.percent])).toEqual([
      ["n", "N", 16],
      ["p2o5", "P₂O₅", 20],
      ["k2o", "K₂O", 0],
    ]);
  });

  it("explain each nutrient in the pamphlet's own words from the p2 table", () => {
    expect(tiles.map((t) => t.role)).toEqual([
      "N = ใบเขียว โตเร็ว",
      "P = ราก ดอก เมล็ด",
      "K = ผลโต หวาน ต้นแข็ง ทนโรค",
    ]);
    for (const t of tiles) expect(textStream(raw(2)), t.role).toContain(textStream(t.role));
  });

  it("state how much of each the bag holds, worked out by the calculator: 8 kg N, 10 kg P₂O₅, none K₂O", () => {
    expect(tiles.map((t) => t.amountKg)).toEqual([8, 10, 0]);
  });
});

describe("the sentence a tile builds is the pamphlet's sentence", () => {
  it("'กระสอบ 50 กก. มี N 8 กก. P₂O₅ 10 กก. และไม่มี K' is on p6, word for word", () => {
    const sentence = `${ui.bagWord} ${BAG.weightKg} ${ui.calcKg} ${ui.bagHas} N 8 ${ui.calcKg} P₂O₅ 10 ${ui.calcKg}`;
    expect(textStream(raw(6))).toContain(textStream(sentence));
    expect(textStream(raw(6))).toContain(textStream(`${ui.bagNone} K`));
  });

  it("uses the pamphlet's words for bag, has, has none, percent and the three numbers on a bag", () => {
    expect([ui.bagWord, ui.bagHas, ui.bagNone, ui.bagPercent, ui.bagLegend]).toEqual([
      "กระสอบ",
      "มี",
      "ไม่มี",
      "เปอร์เซ็นต์",
      "ตัวเลข 3 ตัวบนกระสอบ",
    ]);
    expect(textStream(raw(6))).toContain(textStream(ui.bagLegend));
    expect(textStream(raw(6))).toContain(textStream(`คือ${ui.bagPercent}ของ N – P₂O₅ – K₂O`));
  });
});
