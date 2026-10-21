import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { QuizIsland } from "../components/QuizIsland";
import { readChapters } from "./content";
import { againCount, emptyProgress, parseProgress, rightCount, serializeProgress, setMark } from "./quiz-progress";
import { readUiStrings } from "./ui";

const ui = readUiStrings("th");
const nospace = (s: string) => s.replace(/[\s?]+/g, "");
const raw = ["06", "07"].map((p) => readFileSync(join(process.cwd(), `docs/content/raw/p${p}.txt`), "utf8")).join("\n");
const items = readChapters("th").find((c) => c.frontmatter.chapter === 7)!.frontmatter.quiz!;

describe("the six questions", () => {
  it("are six, and each question and answer is the pamphlet's own text (ignoring spacing and the ?)", () => {
    expect(items).toHaveLength(6);
    for (const { q, a } of items) {
      expect(nospace(raw), q).toContain(nospace(q));
      // The raw answer has stray spaces around subscripts ("K ₂ SO ₄") and "กก ."
      expect(nospace(raw).replace(/\./g, ""), a).toContain(nospace(a).replace(/\./g, ""));
    }
  });

  it("are rendered as exactly those six, in order, with nothing added", () => {
    const html = renderToStaticMarkup(createElement(QuizIsland, { ui, items }));
    const qs = [...html.matchAll(/<p class="quiz-q"[^>]*>(.*?)<\/p>/g)].map((m) => m[1]);
    expect(qs).toEqual(items.map((i) => i.q));
    const as = [...html.matchAll(/<strong class="quiz-a"[^>]*>(.*?)<\/strong>/g)].map((m) => m[1]);
    expect(as).toEqual(items.map((i) => i.a));
  });

  it("starts with every answer closed and nothing marked", () => {
    const html = renderToStaticMarkup(createElement(QuizIsland, { ui, items }));
    expect((html.match(/aria-expanded="false"/g) ?? []).length).toBe(6);
    expect((html.match(/data-mark="none"/g) ?? []).length).toBe(6);
    expect(html).toContain("ทำเครื่องหมายว่าตอบถูก 0 จาก 6");
  });
});

describe("parseProgress: a saved value can never break the quiz", () => {
  const saved = serializeProgress(["right", null, "again", null, null, "right"]);

  it("round-trips what was saved", () => {
    expect(parseProgress(saved, 6)).toEqual(["right", null, "again", null, null, "right"]);
  });

  it.each([
    ["nothing saved", null],
    ["empty string", ""],
    ["not JSON", "{oops"],
    ["a number", "7"],
    ["null", "null"],
    ["an array", "[1,2,3]"],
    ["an object with no marks", "{}"],
    ["a future version", '{"v":2,"marks":["right","right","right","right","right","right"]}'],
    ["too few marks", '{"v":1,"marks":["right"]}'],
    ["too many marks", '{"v":1,"marks":["right","right","right","right","right","right","right"]}'],
    ["marks that is not a list", '{"v":1,"marks":"right"}'],
  ])("%s starts fresh", (_name, value) => {
    expect(parseProgress(value, 6)).toEqual(emptyProgress(6));
  });

  it("turns an unknown mark into 'not yet', keeping the rest", () => {
    expect(parseProgress('{"v":1,"marks":["right","bogus",5,null,{},"again"]}', 6)).toEqual([
      "right",
      null,
      null,
      null,
      null,
      "again",
    ]);
  });
});

describe("setMark and the count", () => {
  it("changes one question and leaves the input alone", () => {
    const before = emptyProgress(6);
    const after = setMark(before, 2, "right");
    expect(after[2]).toBe("right");
    expect(before[2]).toBeNull();
    expect(after.filter(Boolean)).toHaveLength(1);
  });

  it.each([-1, 6, 1.5, Number.NaN])("ignores an out-of-range index (%s)", (i) => {
    expect(setMark(emptyProgress(6), i, "right")).toEqual(emptyProgress(6));
  });

  it("counts the 'right' marks and the 'again' marks separately", () => {
    const marks = ["right", "again", null, "right", null, "again"] as const;
    expect(rightCount(marks)).toBe(2);
    expect(againCount(marks)).toBe(2);
  });
});
