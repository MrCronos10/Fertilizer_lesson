import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { citeIds, proseBlocks, readChapters, textStream } from "./content";

/**
 * T-023: chapters 4 and 7 are made of named <Section> blocks, each stating the pamphlet page
 * its text is on. These tests make "every claim cited" checkable: every word of the prose sits
 * in exactly one section, and each section's words really are on the page it names.
 */
const raw = (page: number) => textStream(readFileSync(join(process.cwd(), `docs/content/raw/p${String(page).padStart(2, "0")}.txt`), "utf8"));
const chapters = readChapters("th");
const chapter = (n: number) => chapters.find((c) => c.frontmatter.chapter === n)!;

type Block = { id: string; page: number; tone?: string; uncited: boolean; body: string };
function sections(body: string): Block[] {
  return [...body.matchAll(/<Section\s+([^>]*)>([\s\S]*?)<\/Section>/g)].map((m) => {
    const attrs = m[1] ?? "";
    return {
      id: /id="([^"]+)"/.exec(attrs)![1]!,
      page: Number(/page=\{(\d+)\}/.exec(attrs)![1]),
      tone: /tone="([^"]+)"/.exec(attrs)?.[1],
      uncited: /\buncited\b/.test(attrs),
      body: m[2] ?? "",
    };
  });
}
const proseOf = (body: string) => textStream(proseBlocks(body).join(""));
const stripNumbering = (body: string) => body.replace(/^\s*\d+\.\s+/gm, "");

describe("chapter 4", () => {
  const ch04 = chapter(4);
  const blocks = sections(ch04.body);

  it("is the six named blocks, in the source's order: 4R, practice, safety, mistakes, environment", () => {
    expect(blocks.map((b) => b.id)).toEqual(["four-r", "practice", "safety", "mistakes", "environment"]);
  });

  it("leaves no prose outside a section: every word sits in one that names its page", () => {
    const outside = ch04.body.replace(/<Section\s+[^>]*>[\s\S]*?<\/Section>/g, "");
    expect(proseBlocks(outside)).toEqual([]);
  });

  it("names a page the chapter was extracted from, and the words are really on that page", () => {
    for (const b of blocks) {
      expect(ch04.frontmatter.sourcePages, b.id).toContain(b.page);
      expect(raw(b.page), b.id).toContain(proseOf(b.body));
    }
  });

  it("presents 4R exactly as the source does, and nothing else in that block", () => {
    const four = blocks.find((b) => b.id === "four-r")!;
    expect(proseBlocks(four.body)).toEqual(["หลัก 4 ถูก (4R): ถูกชนิด ถูกอัตรา ถูกเวลา และถูกที่"]);
  });

  it("has all six common mistakes, in the source's order, as list items of their own", () => {
    const mistakes = blocks.find((b) => b.id === "mistakes")!;
    const items = mistakes.body.split("\n").filter((l) => /^ {2}- /.test(l)).map((l) => l.replace(/^ {2}- /, ""));
    expect(items).toHaveLength(6);
    expect(items.map((i) => i.split(" ")[0])).toEqual(["ใส่มากจนปุ๋ยไหม้", "โรยยูเรียทิ้งบนผิวดิน", "ใส่", "ไม่แก้ดินกรด", "เผาฟาง", "ซื้อ"]);
    // The one figure in the list is the pamphlet's own, with the document it names.
    expect(items[1]).toContain("MSU Extension EB0209");
    expect(items[1]).toContain("30–44%");
    expect(items[1]).toContain("ไม่ถึง 5%");
  });

  it("carries the safety, storage and environment cautions the ticket lists", () => {
    const text = (id: string) => proseOf(blocks.find((b) => b.id === id)!.body);
    for (const w of ["ถุงมือ", "หน้ากาก", "เก็บปุ๋ยในที่แห้ง", "ห่างอาหารเด็กสัตว์และเชื้อเพลิง", "ปิดถุงยูเรียให้สนิท"]) expect(text("safety"), w).toContain(w);
    for (const w of ["สาหร่ายบลูม", "ปลาตาย", "ใกล้บ่อคลองหรือบ่อน้ำดื่ม"]) expect(text("environment"), w).toContain(w);
  });

  it("says 'no outside source' on exactly the blocks that print no marker, and on none that do", () => {
    for (const b of blocks) {
      const hasMarker = /<Cite\b/.test(b.body);
      expect(b.uncited, `${b.id} ${hasMarker ? "has a marker" : "has none"}`).toBe(!hasMarker);
    }
    expect(blocks.filter((b) => b.uncited).map((b) => b.id)).toEqual(["four-r", "safety", "mistakes", "environment"]);
  });

  it("marks safety, mistakes and environment as warnings, and keeps its two printed markers", () => {
    expect(blocks.filter((b) => b.tone === "warn").map((b) => b.id)).toEqual(["safety", "mistakes", "environment"]);
    expect(citeIds(ch04.body)).toEqual(["fao", "oae"]);
    for (const id of citeIds(ch04.body)) expect(ch04.frontmatter.citations).toContain(id);
  });
});

describe("chapter 7's summary", () => {
  const ch07 = chapter(7);
  const [summary] = sections(ch07.body);

  it("is one section, the six numbered points, on the page it names", () => {
    expect(sections(ch07.body)).toHaveLength(1);
    expect(summary!.id).toBe("summary");
    expect(ch07.frontmatter.sourcePages).toContain(summary!.page);
    // The raw page numbers its list too ("1. N …"); the numbering is markup (see content.test.ts), so it is stripped from both.
    expect(textStream(stripNumbering(readFileSync(join(process.cwd(), `docs/content/raw/p0${summary!.page}.txt`), "utf8")))).toContain(proseOf(stripNumbering(summary!.body)));
    expect(summary!.body.match(/^\s*\d+\. /gm)).toHaveLength(6);
    expect(summary!.uncited).toBe(true);
  });
});
