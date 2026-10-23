import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  citeIds,
  parseChapter,
  proseBlocks,
  readChapters,
  textStream,
  type Chapter,
} from "./content";

/**
 * The content-integrity guard for T-005. The hard rule for this project is that
 * no agronomic fact may be invented, so the decisive test here is the
 * zero-rewording one.
 *
 * It is a diff, not a search. `docs/content/raw/manifest.json` records which
 * lines of the raw PDF extraction each chapter was built from; this file
 * rebuilds the expected text stream from those lines and asserts it is *equal*
 * to the shipped MDX once whitespace is removed. Equality is what makes it
 * load-bearing: a containment check would pass a chapter that had been
 * truncated, reordered, or cut to a single line, and all three of those are
 * ways to corrupt agronomic advice without changing a word.
 */

const RAW_DIR = join(process.cwd(), "docs", "content", "raw");

interface Manifest {
  readonly chapters: Record<string, { readonly spans: number[][]; readonly omit: string[] }>;
  readonly excludedProse: readonly { where: string; text: string; why: string }[];
}

const manifest = JSON.parse(readFileSync(join(RAW_DIR, "manifest.json"), "utf8")) as Manifest;

function rawLines(page: number): string[] {
  const file = join(RAW_DIR, `p${String(page).padStart(2, "0")}.txt`);
  return readFileSync(file, "utf8").split("\n");
}

/**
 * Rebuilds what a chapter's prose must say, from the raw extraction alone.
 * The only transformations applied are the ones SOURCES.md documents as
 * mechanical: whitespace (via `textStream`), ordered-list numbering, and the
 * quiz's `→` separator.
 */
function expectedStream(key: string): string {
  const entry = manifest.chapters[key];
  if (!entry) throw new Error(`manifest has no entry for ${key}`);

  let text = entry.spans
    .map(([page, first, last]) => {
      if (page === undefined || first === undefined || last === undefined)
        throw new Error(`${key}: malformed span`);
      const lines = rawLines(page);
      if (last > lines.length) throw new Error(`${key}: p${page} has no line ${last}`);
      return lines.slice(first - 1, last).join("\n");
    })
    .join("\n")
    .replace(/^\s*\d+\.\s+/gm, "") // ordered-list numbering
    .replace(/→/g, ""); // quiz question/answer separator

  for (const omit of entry.omit) text = text.split(omit).join("");
  return textStream(text);
}

/** What the chapter actually ships, markup removed and quiz slot expanded. */
function actualStream(chapter: Chapter): string {
  const quiz = (chapter.frontmatter.quiz ?? []).map(({ q, a }) => `${q}${a}`).join("");
  const body = chapter.body.replace(/<Quiz\b[^>]*\/>/, `\n${quiz}\n`);
  return textStream([chapter.frontmatter.heading, ...proseBlocks(body)].join(""));
}

const chapters = readChapters("th");
const CHAPTER_COUNT = 7;

describe("chapter files", () => {
  it("ships ch01..ch07 in order", () => {
    expect(chapters.map((c) => c.file)).toEqual(
      Array.from({ length: CHAPTER_COUNT }, (_, i) => `ch0${i + 1}.mdx`),
    );
  });

  it.each(chapters)("$file declares non-empty sourcePages", ({ frontmatter }) => {
    expect(frontmatter.sourcePages.length).toBeGreaterThan(0);
  });

  it.each(chapters)("$file declares its number, title and goals", ({ file, frontmatter }) => {
    expect(frontmatter.chapter).toBe(Number(file.slice(2, 4)));
    expect(frontmatter.locale).toBe("th");
    expect(frontmatter.heading).toContain(frontmatter.title);
  });

  it("covers every learning goal G1..G7 across the chapter set", () => {
    const covered = new Set(chapters.flatMap((c) => c.frontmatter.goals));
    expect([...covered].sort()).toEqual(["G1", "G2", "G3", "G4", "G5", "G6", "G7"]);
  });
});

describe("zero rewording against the raw extraction", () => {
  const withProse = chapters.filter((c) => c.frontmatter.proseFromSource);

  it("has the five prose chapters to check", () => {
    expect(withProse.map((c) => c.file)).toEqual([
      "ch01.mdx",
      "ch02.mdx",
      "ch03.mdx",
      "ch04.mdx",
      "ch07.mdx",
    ]);
  });

  it.each(withProse)("$file is the source text and nothing else", (chapter) => {
    const key = chapter.file.replace(".mdx", "");
    const expected = expectedStream(key);
    // Equality between two empty strings would also pass, so prove there is
    // something being compared before comparing it.
    expect(expected.length, `${key}: expected stream is suspiciously short`).toBeGreaterThan(150);
    // Equality, so this fails on a changed word, a dropped clause, a deleted
    // paragraph, an added sentence, or a reordering.
    expect(actualStream(chapter)).toBe(expected);
  });

  it("the manifest covers exactly the prose chapters", () => {
    expect(Object.keys(manifest.chapters).sort()).toEqual([
      "ch01",
      "ch02",
      "ch03",
      "ch04",
      "ch07",
    ]);
  });

  it("every deliberately excluded piece of source prose carries a reason", () => {
    expect(manifest.excludedProse.length).toBeGreaterThan(0);
    for (const entry of manifest.excludedProse) {
      expect(entry.where.trim()).not.toBe("");
      expect(entry.text.trim()).not.toBe("");
      expect(entry.why.trim().length).toBeGreaterThan(20);
    }
  });

  it("the table-only chapters declare no prose and carry table slots", () => {
    const tableOnly = chapters.filter((c) => !c.frontmatter.proseFromSource);
    expect(tableOnly.map((c) => c.file)).toEqual(["ch05.mdx", "ch06.mdx"]);
    for (const chapter of tableOnly) {
      expect(proseBlocks(chapter.body)).toEqual([]);
      expect(chapter.frontmatter.tables.length).toBeGreaterThan(0);
    }
  });
});

/**
 * Guards the guard. If these stop failing, `expectedStream` has gone slack and
 * the zero-rewording test above is no longer proving anything.
 */
describe("the zero-rewording check actually catches corruption", () => {
  const ch03 = chapters.find((c) => c.frontmatter.chapter === 3)!;
  const mutate = (body: string): Chapter => ({ ...ch03, body });

  it("catches a changed number", () => {
    const corrupted = mutate(ch03.body.replace("≈ 22 กก.", "≈ 8 กก."));
    expect(actualStream(corrupted)).not.toBe(expectedStream("ch03"));
  });

  it("catches a number moved onto its own line", () => {
    // The bypass the old containment check allowed: split the line, swap the
    // answer, and every fragment is still found somewhere in the source.
    const corrupted = mutate(
      ch03.body.replace("ให้ใช้ 10 × 100 ÷ 46 ≈ 22 กก.", "ให้ใช้\n- 8 กก."),
    );
    expect(actualStream(corrupted)).not.toBe(expectedStream("ch03"));
  });

  it("catches a truncated clause", () => {
    const corrupted = mutate(ch03.body.replace(" และ 1 เฮกตาร์ = 6.25 ไร่", ""));
    expect(actualStream(corrupted)).not.toBe(expectedStream("ch03"));
  });

  it("catches a deleted paragraph", () => {
    const corrupted = mutate(
      ch03.body.replace(/- \*\*ฉลาก:\*\*.*$/m, ""),
    );
    expect(actualStream(corrupted)).not.toBe(expectedStream("ch03"));
  });

  it("catches reordered bullets", () => {
    const lines = ch03.body.split("\n");
    const a = lines.findIndex((l) => l.includes("คำนวณ"));
    const b = lines.findIndex((l) => l.includes("หน่วย"));
    [lines[a], lines[b]] = [lines[b]!, lines[a]!];
    expect(actualStream(mutate(lines.join("\n")))).not.toBe(expectedStream("ch03"));
  });

  it("catches an invented sentence", () => {
    const corrupted = mutate(`${ch03.body}\nใส่ปุ๋ยทุก 7 วัน\n`);
    expect(actualStream(corrupted)).not.toBe(expectedStream("ch03"));
  });
});

describe("the six source quiz questions", () => {
  const ch07 = chapters.find((c) => c.frontmatter.chapter === 7)!;

  it("live on chapter 7 and nowhere else", () => {
    expect(ch07.frontmatter.quiz).toHaveLength(6);
    expect(chapters.filter((c) => c.frontmatter.quiz).map((c) => c.file)).toEqual(["ch07.mdx"]);
  });

  it("are rendered through the slot the source printed them in", () => {
    expect(ch07.body).toMatch(/<Quiz\b[^>]*\/>/);
  });

  // Verbatim-ness is covered by the equality check above: the quiz text is
  // spliced into `actualStream`, so a reworded question fails there.
});

describe("citations", () => {
  it("every <Cite> id in a body is declared in that chapter's frontmatter", () => {
    for (const { file, body, frontmatter } of chapters) {
      for (const id of citeIds(body)) {
        expect(frontmatter.citations, `${file}: <Cite id="${id}"> is not in citations`).toContain(
          id,
        );
      }
    }
  });

  it("no chapter declares a citation marker its source pages do not print", () => {
    for (const { file, frontmatter } of chapters) {
      const printed = frontmatter.sourcePages.map((p) => rawLines(p).join("\n")).join("\n");
      for (const id of frontmatter.citations) {
        expect(printed, `${file}: "${id}" is not printed on pages ${frontmatter.sourcePages}`).toContain(
          id,
        );
      }
    }
  });

  it("declares no duplicate markers", () => {
    for (const { file, frontmatter } of chapters) {
      expect(new Set(frontmatter.citations).size, `${file} repeats a marker`).toBe(
        frontmatter.citations.length,
      );
    }
  });
});

describe("table extraction slots", () => {
  it("every <SourceTable> id is declared in frontmatter, and vice versa", () => {
    for (const { file, body, frontmatter } of chapters) {
      const used = [...body.matchAll(/<SourceTable id="([^"]+)"\s*\/>/g)].map((m) => m[1]);
      expect(used, `${file}: slots and frontmatter disagree`).toEqual([...frontmatter.tables]);
    }
  });

  it("declares the nine source tables exactly once across the set", () => {
    const all = chapters.flatMap((c) => c.frontmatter.tables);
    expect(all).toHaveLength(9);
    expect(new Set(all).size).toBe(9);
  });
});

describe("frontmatter validation", () => {
  const good = readFileSync(join(process.cwd(), "content", "th", "ch03.mdx"), "utf8");

  it("rejects a file with no frontmatter", () => {
    expect(() => parseChapter("ch03.mdx", "# hello")).toThrow(/missing YAML frontmatter/);
  });

  it("rejects a misspelled key rather than yielding undefined", () => {
    expect(() => parseChapter("ch03.mdx", good.replace("sourcePages:", "sourcePage:"))).toThrow(
      /sourcePages/,
    );
  });

  it("rejects a goal id that is not G1..G7", () => {
    expect(() => parseChapter("ch03.mdx", good.replace("goals: [G4]", "goals: [G9]"))).toThrow(
      /unknown goal G9/,
    );
  });

  it("rejects frontmatter whose chapter disagrees with the filename", () => {
    expect(() => parseChapter("ch03.mdx", good.replace("chapter: 3", "chapter: 4"))).toThrow(
      /frontmatter says chapter 4/,
    );
  });

  it("tolerates a byte-order mark", () => {
    expect(parseChapter("ch03.mdx", `﻿${good}`).frontmatter.chapter).toBe(3);
  });

  it("reads the redesign flag (T-043): optional, false when absent, a boolean when given", () => {
    const without = good.replace(/^redesign:.*\n/m, "");
    expect(parseChapter("ch03.mdx", without).frontmatter.redesign).toBe(false);
    const on = without.replace("proseFromSource:", "redesign: true\nproseFromSource:");
    expect(parseChapter("ch03.mdx", on).frontmatter.redesign).toBe(true);
    expect(() => parseChapter("ch03.mdx", without.replace("proseFromSource:", "redesign: yes please\nproseFromSource:"))).toThrow(
      /redesign must be a boolean/,
    );
  });

  it("chapter 1 opts into the redesign", () => {
    expect(readChapters("th").find((c) => c.frontmatter.chapter === 1)!.frontmatter.redesign).toBe(true);
  });

  it("reports an unknown locale clearly", () => {
    expect(() => readChapters("km")).toThrow(/no content for locale "km"/);
  });
});
