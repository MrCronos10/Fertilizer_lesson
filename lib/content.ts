import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

/**
 * Reads the extracted source chapters. Prose lives in MDX with its page
 * citations in frontmatter (D18); every number lives in JSON (T-006), which is
 * why a chapter body carries `<SourceTable>` slots rather than literal rows.
 */

export const CONTENT_ROOT = join(process.cwd(), "content");

export const GOAL_IDS = ["G1", "G2", "G3", "G4", "G5", "G6", "G7"] as const;
export type GoalId = (typeof GOAL_IDS)[number];

export interface QuizItem {
  readonly q: string;
  readonly a: string;
}

export interface ChapterFrontmatter {
  readonly chapter: number;
  readonly locale: string;
  readonly title: string;
  readonly heading: string;
  readonly goals: readonly GoalId[];
  readonly sourceId: string;
  /** Pages of `sourceId` this chapter was extracted from. Never empty. */
  readonly sourcePages: readonly number[];
  /** Citation marker keys as printed in the source; resolved to URLs in T-007. */
  readonly citations: readonly string[];
  /** Table IDs whose rows were moved to locale-neutral JSON in T-006. */
  readonly tables: readonly string[];
  /** False for the two shared table-only chapters, which have no Thai prose. */
  readonly proseFromSource: boolean;
  readonly quiz?: readonly QuizItem[];
}

export interface Chapter {
  readonly file: string;
  readonly frontmatter: ChapterFrontmatter;
  readonly body: string;
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[^\S\n]*(?:\r?\n|$)/;
const CHAPTER_FILE = /^ch(\d{2,})\.mdx$/;

function fail(file: string, problem: string): never {
  throw new Error(`${file}: ${problem}`);
}

/**
 * YAML parses to `unknown`, and a typo like `sourcePage:` would otherwise
 * surface as `undefined` in a renderer far from the file that caused it.
 */
function validate(file: string, value: unknown): ChapterFrontmatter {
  if (typeof value !== "object" || value === null) fail(file, "frontmatter is not a mapping");
  const fm = value as Record<string, unknown>;

  const str = (key: string): string => {
    const v = fm[key];
    if (typeof v !== "string" || v.trim() === "") fail(file, `${key} must be a non-empty string`);
    return v;
  };
  const strList = (key: string): readonly string[] => {
    const v = fm[key];
    if (!Array.isArray(v) || v.some((e) => typeof e !== "string"))
      fail(file, `${key} must be a list of strings`);
    return v as string[];
  };

  if (typeof fm["chapter"] !== "number" || !Number.isInteger(fm["chapter"]))
    fail(file, "chapter must be an integer");
  if (typeof fm["proseFromSource"] !== "boolean") fail(file, "proseFromSource must be a boolean");

  const sourcePages = fm["sourcePages"];
  if (
    !Array.isArray(sourcePages) ||
    sourcePages.length === 0 ||
    sourcePages.some((p) => !Number.isInteger(p) || (p as number) < 1)
  )
    fail(file, "sourcePages must be a non-empty list of page numbers");

  const goals = strList("goals");
  if (goals.length === 0) fail(file, "goals must not be empty");
  for (const goal of goals) {
    if (!(GOAL_IDS as readonly string[]).includes(goal)) fail(file, `unknown goal ${goal}`);
  }

  const quiz = fm["quiz"];
  if (quiz !== undefined) {
    if (!Array.isArray(quiz)) fail(file, "quiz must be a list");
    for (const item of quiz) {
      const entry = item as Record<string, unknown>;
      if (typeof entry?.["q"] !== "string" || typeof entry?.["a"] !== "string")
        fail(file, "every quiz entry needs a string q and a");
    }
  }

  return {
    chapter: fm["chapter"],
    locale: str("locale"),
    title: str("title"),
    heading: str("heading"),
    goals: goals as readonly GoalId[],
    sourceId: str("sourceId"),
    sourcePages: sourcePages as readonly number[],
    citations: strList("citations"),
    tables: strList("tables"),
    proseFromSource: fm["proseFromSource"],
    ...(quiz ? { quiz: quiz as readonly QuizItem[] } : {}),
  };
}

export function parseChapter(file: string, raw: string): Chapter {
  // A BOM before `---` would otherwise read as missing frontmatter.
  const text = raw.replace(/^﻿/, "");
  const match = FRONTMATTER.exec(text);
  if (!match) fail(file, "missing YAML frontmatter");
  const yaml = match[1] ?? "";
  if (yaml.trim() === "") fail(file, "frontmatter block is empty");

  const frontmatter = validate(file, parseYaml(yaml));
  const expected = CHAPTER_FILE.exec(file)?.[1];
  if (expected !== undefined && frontmatter.chapter !== Number(expected))
    fail(file, `frontmatter says chapter ${frontmatter.chapter}`);

  return { file, frontmatter, body: text.slice(match[0].length) };
}

export function readChapters(locale = "th"): Chapter[] {
  const dir = join(CONTENT_ROOT, locale);
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    throw new Error(`no content for locale "${locale}" (looked in ${dir})`);
  }

  const files = entries.filter((f) => f.endsWith(".mdx"));
  for (const file of files) {
    if (!CHAPTER_FILE.test(file)) fail(file, "chapter files must be named chNN.mdx");
  }

  return files
    .map((f) => parseChapter(f, readFileSync(join(dir, f), "utf8")))
    // Numeric, not lexicographic: ch10 must not sort before ch02.
    .sort((a, b) => a.frontmatter.chapter - b.frontmatter.chapter);
}

/** Every `<Cite id="…" />` in a body, in the order the source printed them. */
export function citeIds(body: string): string[] {
  return [...body.matchAll(/<Cite\s+id="([^"]+)"/g)].flatMap((m) => (m[1] ? [m[1]] : []));
}

/**
 * The prose lines of a chapter body, with everything that is markup rather
 * than source text removed: component slots, markdown emphasis and list
 * markers, and heading hashes. What remains must appear in the raw extraction
 * verbatim.
 */
export function proseBlocks(body: string): string[] {
  return body
    .replace(/<[A-Z][A-Za-z]*(?:\s+[^<>]*?)?\/>/g, "") // self-closing component slots
    .replace(/<\/?[A-Z][A-Za-z]*(?:\s+[^<>]*?)?>/g, "") // <Callout> wrappers
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "") // MDX comments
    .split("\n")
    .map((line) =>
      line
        .replace(/^\s*(?:[-*+]|\d+\.)\s+/, "") // list marker
        .replace(/^#{1,6}\s+/, "") // heading hashes
        .replace(/^\s*>\s?/, "") // blockquote
        .replace(/\*\*|__/g, "") // bold
        .replace(/`/g, "") // inline code
        .trim(),
    )
    .filter((line) => line.length > 0);
}

/** Collapses every whitespace character, so only the text stream is compared. */
export function textStream(value: string): string {
  return value.replace(/\s+/gu, "");
}

/** URL segment for a chapter: `ch01`, matching its file name without the extension. */
export function chapterSlug(chapter: number): string {
  return `ch${String(chapter).padStart(2, "0")}`;
}
