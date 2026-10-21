import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RENDERED_TABLE_IDS, makeSourceTable } from "../components/SourceTables";
import { makeNums } from "../components/Nums";
import { citeIds, readChapters, textStream } from "./content";
import { nutrientGroupRows } from "./data";
import { NUMS, numsFor } from "./nums";
import { readUiStrings } from "./ui";

const ui = readUiStrings("th");
const raw = (page: number) => readFileSync(join(process.cwd(), `docs/content/raw/p${String(page).padStart(2, "0")}.txt`), "utf8");
const plain = (html: string) => html.replace(/<[^>]+>/g, "|").replace(/\|+/g, "|");
const render = (id: string) => renderToStaticMarkup(makeSourceTable(ui)({ id }));

describe("p2 nutrient-group table", () => {
  const html = render("nutrient-groups");
  const rows = nutrientGroupRows();

  it("renders exactly the three JSON rows, each with its own group, elements and role", () => {
    expect(rows).toHaveLength(3);
    expect((html.match(/<tr data-row=/g) ?? []).length).toBe(3);
    for (const row of rows) {
      const tr = new RegExp(`<tr data-row="${row.id}"[^>]*>(.*?)</tr>`).exec(html)?.[1] ?? "";
      expect(plain(tr), row.id).toBe(`|${row.labels.th.group}|${row.elements.join(", ")}|${row.labels.th.role}|`);
    }
  });

  it("keeps the rows in the source's order", () => {
    expect([...html.matchAll(/data-row="([^"]+)"/g)].map((m) => m[1])).toEqual([
      "macronutrients",
      "secondary",
      "micronutrients",
    ]);
  });

  it("uses the source's own column headings", () => {
    // Equality first: a prefix such as "หน้าที่" is a substring of the real heading and would pass containment.
    expect([ui.colGroup, ui.colElements, ui.colRole]).toEqual(["กลุ่ม", "ธาตุ", "หน้าที่ (จำง่าย)"]);
    expect(textStream(raw(2))).toContain(textStream(`${ui.colGroup} ${ui.colElements} ${ui.colRole}`));
    expect(html).toContain(`<th scope="col">${ui.colGroup}</th>`);
    expect(html).toContain(`<th scope="col">${ui.colRole}</th>`);
  });

  it("is a real table with a caption, column headers and row headers", () => {
    expect(html).toMatch(/<caption[^>]*>.+<\/caption>/);
    expect((html.match(/<th scope="col">/g) ?? []).length).toBe(3);
    expect((html.match(/<th scope="row">/g) ?? []).length).toBe(3);
  });

  it("names the page it came from on screen", () => {
    expect(plain(html)).toContain(`${ui.pamphletPages}: 2`);
    expect(html).toContain('data-source-page="2"');
  });

  it("never shows an elemental/oxide mixture: only the source's element symbols", () => {
    expect(html).not.toMatch(/P2O5|P₂O₅|K2O|K₂O/);
  });
});

describe("which tables render", () => {
  it("is exactly the six tables for Thai readers: p2 groups, p3 symptoms and the four fertilizer tables", () => {
    expect(RENDERED_TABLE_IDS).toEqual([
      "nutrient-groups",
      "deficiency-symptoms",
      "organic-fertilizer-npk",
      "straight-fertilizers",
      "compound-grades",
      "soil-conditioners",
    ]);
  });

  it.each(["rice-by-soil-group-kh", "other-crops", "glossary", "no-such-table"])(
    "%s renders no table",
    (id) => {
      expect(render(id)).not.toMatch(/<table/);
    },
  );
});

describe("the deficiency symptom table (T-018)", () => {
  const html = render("deficiency-symptoms");
  const rows = [...html.matchAll(/<tr data-row="([^"]+)" data-source-page="(\d+)"><th scope="row" lang="en">(.*?)<\/th><td>(.*?)<\/td><\/tr>/g)];
  const squash = (t: string) => t.replace(/\s+/g, "");

  it("has all 10 rows, each from page 3, each cell as the pamphlet prints it", () => {
    expect(rows).toHaveLength(10);
    const page = squash(raw(3));
    for (const [, id, sourcePage, element, symptom] of rows) {
      expect(sourcePage, id).toBe("3");
      expect(page, `${id} symptom`).toContain(squash(symptom ?? ""));
      expect(page, `${id} element`).toContain(squash((element ?? "").replace(/ \/ /g, "/")));
    }
  });

  it("uses the pamphlet's own two headings and names its page", () => {
    expect([ui.colElements, ui.colSymptom]).toEqual(["ธาตุ", "อาการ"]);
    expect(squash(raw(3))).toContain(squash(`${ui.colElements} ${ui.colSymptom}`));
    expect(html).toContain(`<th scope="col">${ui.colSymptom}</th>`);
    expect(plain(html)).toContain(`${ui.pamphletPages}: 3`);
  });

  it("is a real table with a caption", () => {
    expect(html).toMatch(/<caption[^>]*>.+<\/caption>/);
  });
});

describe("nums", () => {
  // Containment in the raw page cannot see a truncated figure, a swapped citation
  // or a dropped "+2", so chapter 1's list is also pinned exactly.
  it("is exactly the three figures chapter 1 relies on, each with its own citation", () => {
    expect(numsFor(1)).toEqual([
      { text: "พ.ร.บ.ปุ๋ย พ.ศ. 2518", sourcePage: 2, cite: "doa" },
      { text: "ธาตุที่เคลื่อนที่ได้ในพืช (N, P, K, Mg) แสดงอาการที่ ใบแก่ ก่อน", sourcePage: 2, cite: "uga", more: 2 },
      { text: "ธาตุที่เคลื่อนที่ไม่ได้ (Fe, Ca, B, S, Mn) แสดงอาการที่ ใบอ่อน/ยอด ก่อน", sourcePage: 2, cite: "uga", more: 2 },
    ]);
  });

  it("puts each citation, and its overflow count, on the figure it belongs to", () => {
    const html = renderToStaticMarkup(makeNums(ui)({ chapter: 1 }));
    const lis = [...html.matchAll(/<li>(.*?)<\/li>/g)].map((m) => m[1] ?? "");
    expect(lis).toHaveLength(3);
    numsFor(1).forEach((item, i) => {
      const li = lis[i] ?? "";
      expect(li, item.text).toContain(item.text);
      expect(li, item.text).toContain(`href="#src-${item.cite}"`);
      expect(li.replace(/<[^>]+>/g, "").includes(item.more ? `+${item.more}` : "+"), item.text).toBe(Boolean(item.more));
    });
  });

  it("pins every figure to a stretch of the raw page it names", () => {
    for (const [chapter, items] of Object.entries(NUMS)) {
      expect(items.length, `chapter ${chapter}`).toBeGreaterThan(0);
      for (const item of items) {
        expect(textStream(raw(item.sourcePage)), item.text).toContain(textStream(item.text));
      }
    }
  });

  it("cites only sources the chapter itself lists, and only ones its prose cites", () => {
    for (const chapter of readChapters("th")) {
      const items = numsFor(chapter.frontmatter.chapter);
      for (const item of items) {
        expect(chapter.frontmatter.citations, item.text).toContain(item.cite);
        expect(citeIds(chapter.body), item.text).toContain(item.cite);
      }
    }
  });

  it("only exists for chapters whose body has a <Nums> slot, and vice versa", () => {
    for (const c of readChapters("th")) {
      const hasSlot = new RegExp(`<Nums chapter=\\{${c.frontmatter.chapter}\\}\\s*/>`).test(c.body);
      expect(hasSlot, c.file).toBe(numsFor(c.frontmatter.chapter).length > 0);
    }
  });

  it("renders every figure with a link to its source", () => {
    const html = renderToStaticMarkup(makeNums(ui)({ chapter: 1 }));
    for (const item of numsFor(1)) {
      expect(html).toContain(item.text);
      expect(html).toContain(`href="#src-${item.cite}"`);
    }
    expect(html).toContain(ui.numsHeading);
  });

  it("renders nothing for a chapter with no figures", () => {
    expect(renderToStaticMarkup(makeNums(ui)({ chapter: 6 }))).toBe("");
  });
});
