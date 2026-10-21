import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { makeSourceTable } from "../components/SourceTables";
import { readChapters } from "./content";
import { compoundGradeRows, organicFertilizers, soilConditioners, straightFertilizers } from "./data";
import { readUiStrings } from "./ui";

/** T-019: the four fertilizer tables of chapter 2, read back from the rendered HTML, not from the data. */
const ui = readUiStrings("th");
const nospace = (s: string) => s.replace(/\s+/g, "");
const raw = (page: number) => nospace(readFileSync(join(process.cwd(), `docs/content/raw/p${String(page).padStart(2, "0")}.txt`), "utf8"));
const render = (id: string) => renderToStaticMarkup(makeSourceTable(ui)({ id }));
const text = (html: string) => html.replace(/<sup class="cite">.*?<\/sup>/g, "").replace(/<[^>]+>/g, "|").replace(/\|+/g, "|");
const ch02 = readChapters("th").find((c) => c.frontmatter.chapter === 2)!;

const TABLES = [
  { id: "organic-fertilizer-npk", page: 3, rows: organicFertilizers("th"), count: 5, headings: ["ชนิด", "N-P-K (%)", "ลักษณะ / ใช้กับ"] },
  { id: "straight-fertilizers", page: 4, rows: straightFertilizers(), count: 7, headings: ["ปุ๋ย", "สูตร", "ลักษณะ", "ใช้กับ"] },
  { id: "compound-grades", page: 5, rows: compoundGradeRows(), count: 6, headings: ["สูตร", "ใช้กับ"] },
  { id: "soil-conditioners", page: 5, rows: soilConditioners(), count: 4, headings: ["วัสดุ", "ใช้ทำอะไร", "ปริมาณเทียบกับหินปูนบด"] },
] as const;

describe.each(TABLES)("$id", ({ id, page, rows, count, headings }) => {
  const html = render(id);
  const trs = [...html.matchAll(/<tr data-row="([^"]+)" data-source-page="(\d+)">(.*?)<\/tr>/g)];

  it(`has exactly ${count} rows, in the data's order, each from page ${page}`, () => {
    expect(trs.map((m) => m[1])).toEqual(rows.map((r) => r.id));
    expect(trs).toHaveLength(count);
    for (const m of trs) expect(m[2]).toBe(String(page));
  });

  it("uses the pamphlet's own column headings and names its page", () => {
    const ths = [...html.matchAll(/<th scope="col">(.*?)<\/th>/g)].map((m) => m[1]);
    expect(ths).toEqual(headings);
    expect(raw(page)).toContain(nospace(headings.join(" ")));
    expect(text(html)).toContain(`${ui.pamphletPages}: ${page}`);
  });

  it("shows every cell as the pamphlet prints it (ignoring spacing)", () => {
    const page_ = raw(page);
    for (const m of trs) {
      const cells = (text(m[3] ?? "").split("|").filter(Boolean));
      expect(cells.length, m[1]).toBe(headings.length);
      for (const cell of cells) expect(page_, `${m[1]}: ${cell}`).toContain(nospace(cell));
    }
  });

  it("is a real table: a caption, column headers and a row header on every row", () => {
    expect(html).toMatch(/<caption[^>]*>.+<\/caption>/);
    expect((html.match(/<th scope="row">/g) ?? []).length).toBe(count);
  });

  it("links each row's printed citations, every one resolving to chapter 2's sources list, with its tier shown", () => {
    for (const row of rows) {
      const tr = trs.find((m) => m[1] === row.id)?.[3] ?? "";
      const cited = [...tr.matchAll(/data-cite="([^"]+)"/g)].map((m) => m[1]);
      expect(cited, row.id).toEqual([...(row.citations ?? [])]);
      for (const c of cited) expect(ch02.frontmatter.citations, `${row.id} -> ${c}`).toContain(c);
      expect((tr.match(/data-tier="/g) ?? []).length, row.id).toBe(cited.length);
    }
  });
});

describe("what the tables say, spot-checked against the pamphlet", () => {
  it("keeps the organic figures exactly as printed, including two decimals", () => {
    const t = text(render("organic-fertilizer-npk"));
    for (const n of ["1.1-0.4-1.6", "2.42-6.29-2.11", "1.5-0.4-1.0", "1.98-0.3-2.41", "0.59-0.08-1.72"]) {
      expect(t).toContain(n);
    }
  });

  it("writes compound grades the way the source does: slash-separated lists", () => {
    const t = text(render("compound-grades"));
    for (const g of ["15-15-15 / 16-16-16", "16-20-0 / 18-22-0 / 20-20-0", "8-24-24 / 12-24-12"]) expect(t).toContain(g);
  });

  it("keeps the soil-conditioner equivalence column, with gypsum's dash", () => {
    const t = text(render("soil-conditioners"));
    for (const e of ["1.25 เท่า", "0.92 เท่า", "0.74 เท่า"]) expect(t).toContain(e);
    expect(t).toContain("|–|");
  });

  it("gives rock phosphate no invented grade", () => {
    const rock = /<tr data-row="rock-phosphate"[^>]*>(.*?)<\/tr>/.exec(render("straight-fertilizers"))?.[1] ?? "";
    expect(text(rock)).toBe("|หินฟอสเฟต|P ละลายช้า|เหมาะกับดินกรด|รองก้นหลุมยางพารา ไม้ยืนต้น|");
  });
});

describe("chapter 2 names every fertilizer type the ticket lists", () => {
  const rendered = ["organic-fertilizer-npk", "straight-fertilizers", "compound-grades", "soil-conditioners"].map(render).join(" ");
  const chapter = `${ch02.body} ${rendered}`;
  it.each([
    ["urea", "ยูเรีย"],
    ["ammonium sulfate", "แอมโมเนียมซัลเฟต"],
    ["DAP", "DAP"],
    ["TSP", "TSP"],
    ["rock phosphate", "หินฟอสเฟต"],
    ["KCl", "KCl"],
    ["K2SO4", "K₂SO₄"],
    ["compound", "ปุ๋ยสูตรผสม"],
    ["slow-release", "ปุ๋ยละลายช้า"],
    ["foliar", "ปุ๋ยทางใบ"],
    ["lime", "ปูนขาว"],
    ["marl", "ปูนมาร์ล"],
    ["dolomite", "โดโลไมท์"],
    ["gypsum", "ยิปซัม"],
  ])("%s", (_name, thai) => {
    expect(chapter).toContain(thai);
  });
});
