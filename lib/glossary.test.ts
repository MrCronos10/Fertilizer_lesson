import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { textStream } from "./content";
import { glossaryRows } from "./data";

/**
 * T-009 guards. CONTEXT.md is a glossary, and a glossary is only worth having
 * if its claims about the source are true. A first draft of it said a Thai term
 * (สูตรปุ๋ย) was the source's own when the source never uses it, and defined
 * basal fertilizer and top dressing with phrases the source does not contain.
 * These tests check the glossary against the committed source text so that
 * cannot recur unnoticed.
 */

const ROOT = process.cwd();
const CONTEXT = readFileSync(join(ROOT, "CONTEXT.md"), "utf8");

/** Everything the pamphlet actually says: raw pages plus the extracted chapters. */
function sourceText(): string {
  const raw = readdirSync(join(ROOT, "docs", "content", "raw"))
    .filter((f) => f.endsWith(".txt"))
    .map((f) => readFileSync(join(ROOT, "docs", "content", "raw", f), "utf8"));
  const chapters = readdirSync(join(ROOT, "content", "th"))
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => readFileSync(join(ROOT, "content", "th", f), "utf8"));
  return textStream([...raw, ...chapters].join("\n"));
}

const SOURCE = sourceText();
const THAI = /[฀-๿]/;

describe("the p14 glossary is fully imported", () => {
  const rows = glossaryRows();

  it("starts from the source's twenty rows", () => {
    expect(rows).toHaveLength(20);
  });

  it.each(rows)("$id: Thai and English appear together in one table row", (row) => {
    const line = `| ${row.labels.th} | ${row.labels.en} |`;
    expect(CONTEXT, `missing glossary row: ${line}`).toContain(line);
  });

  it("carries no Chinese or Khmer in the glossary table, which is Thai + English only", () => {
    const table = CONTEXT.slice(
      CONTEXT.indexOf("## Terms from the source glossary"),
      CONTEXT.indexOf("## Reconciled on import"),
    );
    expect(table).not.toMatch(/[一-鿿]/);
    expect(table).not.toMatch(/[ក-៿]/);
  });
});

describe("no provisional term survives", () => {
  it("has no ⏳ marker", () => {
    expect(CONTEXT).not.toContain("⏳");
  });

  it("explains every ⚠ term as not the source's own", () => {
    // Only a paragraph that *begins* with ⚠ is a flagged term; the legend and the
    // reconciliation list merely mention the symbol.
    const flagged = [...CONTEXT.matchAll(/^⚠/gm)].map((m) => [m.index!] as const);
    expect(flagged.length, "expected at least one flagged term").toBeGreaterThan(0);
    for (const [index] of flagged) {
      // Markdown bold is stripped so "**not** printed" reads as "not printed".
      const paragraph = CONTEXT.slice(index, index + 400).replace(/\*/g, "");
      expect(paragraph, "a ⚠ note must say the term is not in the source").toMatch(
        /not (?:occur|printed|in the source)|does not occur/i,
      );
    }
  });
});

describe("every conflict is called out, and the source wins", () => {
  const section = CONTEXT.slice(CONTEXT.indexOf("## Reconciled on import"), CONTEXT.indexOf("## Domain concepts"));

  it("has a Reconciled-on-import section with numbered items", () => {
    expect(section.length).toBeGreaterThan(500);
    expect([...section.matchAll(/^\d+\. /gm)].length).toBeGreaterThanOrEqual(6);
  });

  it("records the three corrections that came from checking the source", () => {
    expect(section).toMatch(/สูตรปุ๋ย is not a source term/);
    expect(section).toMatch(/Primary[\s\S]*→ Macronutrients/);
    expect(section).toMatch(/ปุ๋ยรองพื้น and ปุ๋ยแต่งหน้า were defined with words the source does not use/);
  });

  it("flags the source's own inconsistency over ปุ๋ยสูตรผสม rather than resolving it silently", () => {
    expect(section).toMatch(/ambiguous inside the source/);
  });

  it("points at the open basal/top-dressing disagreement instead of settling it", () => {
    expect(section).toMatch(/A-05/);
    expect(section).toMatch(/owner's/);
  });
});

describe("what the glossary says the source says, the source says", () => {
  it("every Thai phrase quoted in CONTEXT.md appears in the source", () => {
    // Line breaks are collapsed first: a quotation that wraps would otherwise
    // pair its closing mark with the next opening one.
    // Only the agronomic-terms sections are claims about the pamphlet. The
    // "Domain concepts" section quotes the owner's other project file (`nums`),
    // which is not part of the source.
    const agronomic = CONTEXT.slice(0, CONTEXT.indexOf("## Domain concepts"));
    const flat = agronomic.replace(/\s+/g, " ");
    expect((flat.match(/"/g) ?? []).length % 2, "unbalanced double quotes in CONTEXT.md").toBe(0);
    const quoted = [...flat.matchAll(/"([^"]+)"/g)].map((m) => m[1]!).filter((q) => THAI.test(q));
    expect(quoted.length, "expected quoted Thai to check").toBeGreaterThan(3);
    for (const phrase of quoted) {
      expect(SOURCE, `"${phrase}" is quoted as the source's wording but is not in it`).toContain(
        textStream(phrase),
      );
    }
  });

  it("สูตรปุ๋ย really does not occur in the source", () => {
    // The claim made in CONTEXT.md; if the source is ever re-extracted and the
    // phrase appears, this fails and the glossary must be revisited.
    expect(SOURCE).not.toContain("สูตรปุ๋ย");
  });

  it("the terms marked as confirmed-elsewhere are in the source", () => {
    for (const term of ["ไร่", "ธาตุอาหารหลัก", "ธาตุอาหารรอง", "4R", "ที่มาของตัวเลข", "ตัวเลข3ตัวบนกระสอบ"]) {
      expect(SOURCE, term).toContain(textStream(term));
    }
  });

  it("the source's definitions of basal and top dressing are the ones quoted", () => {
    expect(SOURCE).toContain(textStream("ใส่ก่อนหรือพร้อมปลูก"));
    expect(SOURCE).toContain(textStream("ใส่ระหว่างที่พืชเติบโต"));
  });
});

describe("CONTEXT.md stays a glossary", () => {
  it("contains no implementation vocabulary", () => {
    // The glossary must not become a spec or a place for implementation notes.
    const forbidden = [
      /\bReact\b/, /\bNext\.js\b/, /\bTypeScript\b/, /\bVitest\b/, /\bPlaywright\b/,
      /\bthree\.js\b/i, /\bWebGL\b(?! use)/, /\bnpm\b/, /\bcomponent\b/i, /\bfunction\b/i,
      /\bAPI\b/, /\bendpoint\b/i, /\bschema\b/i,
    ];
    // "Interactive" legitimately says which ones use WebGL; allow that sentence only.
    const text = CONTEXT.replace(/Exactly two Interactives use WebGL[^.]*\./, "");
    for (const pattern of forbidden) {
      expect(text, `implementation word ${pattern} found in CONTEXT.md`).not.toMatch(pattern);
    }
  });

  it("has no code fences", () => {
    expect(CONTEXT).not.toContain("```");
  });
});

/**
 * The first suite guarded quoted phrases and the twenty table rows, and a review
 * showed that left every *unquoted* claim about the source unchecked: "1,200 m²"
 * for the rai, a different bag example, a wrong chapter for 4R, or a false claim
 * about what the glossary data holds would all have passed. Each unquoted claim
 * CONTEXT.md makes is pinned to the source below.
 */
describe("unquoted claims about the source are true", () => {
  // The markdown wraps lines mid-sentence, so claims are compared flattened.
  const FLAT = CONTEXT.replace(/\s+/g, " ");

  const raw = (page: string) =>
    textStream(readFileSync(join(ROOT, "docs", "content", "raw", `p${page}.txt`), "utf8"));

  it("the rai conversion: CONTEXT.md states it, and the source says it", () => {
    expect(CONTEXT).toContain("1 ไร่ = 1,600 m²");
    expect(CONTEXT).toContain("6.25 ไร่");
    expect(raw("06")).toContain(textStream("1 ไร่ = 1,600 ตร . ม ."));
    expect(raw("06")).toContain(textStream("1 เฮกตาร์ = 6.25 ไร่"));
  });

  it("the bag example: a 50 kg bag of 16-20-0 holds 8 kg N and 10 kg P₂O₅", () => {
    expect(FLAT).toContain("50 kg bag of `16-20-0` contains 8 kg N and 10 kg P₂O₅");
    expect(raw("06")).toContain(textStream("16-20-0 กระสอบ 50 กก . มี N 8 กก . P₂O₅ 10 กก ."));
  });

  it("the micronutrient list is the p2 list, element for element", () => {
    const row = readFileSync(join(ROOT, "content", "data", "nutrient-groups.json"), "utf8");
    const elements = (JSON.parse(row) as { rows: { id: string; elements: string[] }[] }).rows;
    for (const { elements: list } of elements) {
      expect(FLAT, `CONTEXT.md lacks the p2 list ${list.join(", ")}`).toContain(list.join(", "));
    }
  });

  it("the nutrient groups carry p2's own English labels, element for element", () => {
    // The source's labels, read from the committed p2 text, must each be the bold
    // label CONTEXT.md gives — so renaming a group (e.g. back to "primary") fails.
    const p2 = raw("02");
    for (const [label, elements] of [
      ["Macronutrients", "N, P, K"],
      ["Secondary", "Ca, Mg, S"],
      ["Micronutrients", "Fe, Zn, B, Mn, Cu, Mo, Cl, Ni"],
    ] as const) {
      expect(p2, `p2 does not print "${label}"`).toContain(textStream(label));
      expect(FLAT, `CONTEXT.md does not give the source's label ${label}`).toContain(
        `**${label}** (${elements})`,
      );
    }
  });

  it("4R sits under chapter 4, not the safety bullet or another chapter", () => {
    const p6 = readFileSync(join(ROOT, "docs", "content", "raw", "p06.txt"), "utf8");
    const four = p6.indexOf("บทที่  4");
    const seven = p6.indexOf("บทที่  7");
    const rule = p6.indexOf("4R");
    expect(four).toBeGreaterThan(-1);
    expect(rule).toBeGreaterThan(four);
    expect(rule).toBeLessThan(seven);
    expect(FLAT).toContain("chapter 4, การใส่ปุ๋ยในทางปฏิบัติ");
    expect(textStream(p6)).toContain(textStream("หลัก 4 ถูก (4R): ถูกชนิด ถูกอัตรา ถูกเวลา และถูกที่"));
  });

  it("§2.8 says the soil conditioners are not fertilizer, and names ground limestone as the baseline", () => {
    expect(SOURCE).toContain(textStream("สารเหล่านี้ไม่ใช่ปุ๋ย"));
    expect(SOURCE).toContain(textStream("ปริมาณเทียบกับหินปูนบด"));
    expect(CONTEXT).toContain("หินปูนบด");
  });

  it("chapters 4 and 7 treat surface urea as a mistake and say to bury it", () => {
    expect(SOURCE).toContain(textStream("โรยยูเรียทิ้งบนผิวดิน"));
    expect(SOURCE).toContain(textStream("กลบยูเรียทุกครั้ง"));
  });

  it("the two basal / top-dressing definitions come from §2.7 specifically", () => {
    // Appearing "somewhere in the source" is not enough: the same words could
    // occur in another context. Both must follow the §2.7 heading on p5.
    const p5 = textStream(readFileSync(join(ROOT, "docs", "content", "raw", "p05.txt"), "utf8"));
    const after = p5.slice(p5.indexOf(textStream("2.7 ปุ๋ยรองพื้น")));
    expect(after).toContain(textStream("ใส่ก่อนหรือพร้อมปลูก เน้น P และ K"));
    expect(after).toContain(textStream("ใส่ระหว่างที่พืชเติบโต เน้น N และแบ่งใส่หลายครั้ง"));
  });

  it("the three chemical types and the compound term are as the source prints them", () => {
    expect(SOURCE).toContain(textStream("เชิงเดี่ยว เชิงผสม และเชิงประกอบ"));
    expect(SOURCE).toContain(textStream("2.4 ปุ๋ยสูตรผสม NPK (Compound"));
  });

  it("what CONTEXT.md says the glossary data holds is what it holds", () => {
    const data = JSON.parse(
      readFileSync(join(ROOT, "content", "data", "glossary.json"), "utf8"),
    ) as { rows: { labels: Record<string, string> }[] };
    expect(FLAT).toContain("The Chinese is kept in the glossary data");
    expect(FLAT).toContain("Khmer column is not carried anywhere");
    for (const row of data.rows) {
      expect(Object.keys(row.labels).sort()).toEqual(["en", "th", "zh"]); // Chinese yes, Khmer no
    }
  });

  it("the p14-only terms really are absent from the chapters", () => {
    const chapters = readdirSync(join(ROOT, "content", "th"))
      .filter((f) => f.endsWith(".mdx"))
      .map((f) => readFileSync(join(ROOT, "content", "th", f), "utf8"))
      .join("\n");
    for (const term of ["ปุ๋ยไนโตรเจน", "ปุ๋ยฟอสเฟต", "ปุ๋ยโพแทช", "ไดแอมโมเนียมฟอสเฟต"]) {
      expect(chapters, `${term} is claimed p14-only but appears in a chapter`).not.toContain(term);
    }
  });
});
