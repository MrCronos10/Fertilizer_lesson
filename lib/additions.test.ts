import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  GUARDED_STRINGS,
  auditAddition,
  contentFiles,
  findGuardedPastes,
  gateViolations,
  hostAllowed,
  malformedHeadings,
  parseAdditions,
  referencedIds,
  type Addition,
} from "./additions";

/**
 * T-008 guards. The D8 gate is only as good as the check that enforces it, so
 * the first half of this file proves the check *can* fail — against synthetic
 * files — before the second half asserts it passes on the real tree.
 */

const MARKDOWN = readFileSync(join(process.cwd(), "docs", "content", "ADDITIONS.md"), "utf8");
const ADDITIONS = parseAdditions(MARKDOWN);
const CONTENT_DIR = join(process.cwd(), "content");

const entry = (over: Partial<Addition>): Addition => ({
  id: "A-90",
  title: "t",
  approved: false,
  goals: ["G4"],
  feature: "f",
  sources: [],
  inheritsFrom: [],
  sourceLines: [],
  checkboxLines: [],
  approvalLines: [],
  claimLines: 1,
  hasHowRead: true,
  ...over,
});

describe("the gate can actually fail", () => {
  it("flags a content file that references an unticked addition", () => {
    const v = gateViolations([entry({ id: "A-90", approved: false })], [["content/th/ch01.mdx", "see A-90"]]);
    expect(v).toEqual([{ file: "content/th/ch01.mdx", id: "A-90", reason: "unticked" }]);
  });

  it("lets a ticked addition through", () => {
    expect(
      gateViolations([entry({ id: "A-90", approved: true })], [["content/th/ch01.mdx", "see A-90"]]),
    ).toEqual([]);
  });

  it("flags a reference to an addition that does not exist", () => {
    const v = gateViolations([], [["content/data/x.json", '{"addition":"A-77"}']]);
    expect(v).toEqual([{ file: "content/data/x.json", id: "A-77", reason: "unknown" }]);
  });

  it("finds references in frontmatter, JSON and prose alike", () => {
    expect(referencedIds("additions: [A-01, A-02]")).toEqual(["A-01", "A-02"]);
    expect(referencedIds('{"addition":"A-03"}')).toEqual(["A-03"]);
    expect(referencedIds("ดู A-04 ประกอบ")).toEqual(["A-04"]);
  });

  it("does not mistake the Rice Knowledge Bank's page code for an addition", () => {
    expect(referencedIds("https://rkb.ricethailand.go.th/web/content_page.php?code=A-60O299W4F9")).toEqual([]);
    expect(referencedIds("A-07x, XA-07")).toEqual([]);
    // Hex escapes in a percent-encoded URL hold "A7" and "A1".
    expect(referencedIds("https://www.doa.go.th/%E0%B8%A7%E0%B8%A1/x")).toEqual([]);
  });
});

describe("docs/content/ADDITIONS.md", () => {
  it("parses a set of entries with unique, contiguous ids", () => {
    expect(ADDITIONS.length).toBeGreaterThanOrEqual(9);
    const ids = ADDITIONS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(ids.map((_, i) => `A-${String(i + 1).padStart(2, "0")}`));
  });

  it.each(ADDITIONS)("$id has every field D8 requires", (a) => {
    expect(a.goals.length, `${a.id} names no goal`).toBeGreaterThan(0);
    expect(a.feature.trim(), `${a.id} names no feature`).not.toBe("");
    expect(a.claimLines, `${a.id} has no exact claim`).toBeGreaterThan(0);
    expect(a.hasHowRead, `${a.id} does not say how it was read`).toBe(true);
  });

  it.each(ADDITIONS)("$id passes the strict audit (one approval line, official source, URL form)", (a) => {
    expect(auditAddition(a, ADDITIONS)).toEqual([]);
  });

  it("has no heading that looks like an entry but is not one", () => {
    expect(malformedHeadings(MARKDOWN)).toEqual([]);
  });

  it("rejects hosts D8 does not allow", () => {
    expect(hostAllowed("https://www.doa.go.th/x.pdf")).toBe(true);
    expect(hostAllowed("https://orgweb.ldd.go.th/x.pdf")).toBe(true);
    expect(hostAllowed("https://rkb.ricethailand.go.th/web/content_page.php")).toBe(true);
    expect(hostAllowed("https://faolex.fao.org/docs/pdf/tha201749.pdf")).toBe(false);
    expect(hostAllowed("https://www.rubber.co.th/x")).toBe(false);
    expect(hostAllowed("https://doa.go.th.evil.example/x")).toBe(false);
    expect(hostAllowed("https://notdoa.go.th/x")).toBe(false);
  });

  it("cites no Thai commercial or blog source", () => {
    for (const url of ADDITIONS.flatMap((a) => [...a.sources])) {
      expect(url).not.toMatch(/blogspot|wordpress|rakbankerd|naikham|yara|apkgroup/);
    }
  });

  it("carries a Thai exact claim, not paraphrase, in every entry", () => {
    for (const a of ADDITIONS) {
      const section = MARKDOWN.slice(MARKDOWN.indexOf(`### ${a.id} —`));
      const end = section.indexOf("\n### ", 5);
      const body = end === -1 ? section : section.slice(0, end);
      expect(body, `${a.id} has no Thai text`).toMatch(/[฀-๿]{6,}/);
    }
  });
});

describe("nothing in content/ outruns an approval", () => {
  it("references no unticked or unknown addition", () => {
    expect(gateViolations(ADDITIONS, contentFiles(CONTENT_DIR))).toEqual([]);
  });

  it("scans a non-trivial amount of content, so an empty scan cannot pass vacuously", () => {
    const files = contentFiles(CONTENT_DIR);
    expect(files.length).toBeGreaterThan(15);
    expect(files.some(([f]) => f.endsWith("ch01.mdx"))).toBe(true);
    expect(files.some(([f]) => f.endsWith("other-crops.json"))).toBe(true);
  });

  it("would catch a real reference planted in a real content file", () => {
    const [file, text] = contentFiles(CONTENT_DIR).find(([f]) => f.endsWith("ch03.mdx"))!;
    const planted = [[file, `${text}\nadditions: [A-03]`]] as const;
    expect(gateViolations(ADDITIONS.map((a) => ({ ...a, approved: false })), planted)).toHaveLength(1);
    expect(gateViolations(ADDITIONS.map((a) => ({ ...a, approved: true })), planted)).toHaveLength(0);
  });
});

describe("the gate resists the bypasses a review demonstrated", () => {
  const ticked = [entry({ id: "A-03", approved: false })];
  const violationsFor = (text: string) => gateViolations(ticked, [["content/x.mdx", text]]);

  it.each([
    ["en dash", "A\u201303"],
    ["non-breaking hyphen", "A\u201103"],
    ["minus sign", "A\u221203"],
    ["lowercase", "a-03"],
    ["no leading zero", "A-3"],
    ["extra leading zero", "A-003"],
    ["no separator", "A03"],
    ["a space", "A 03"],
    ["full-width digits", "A-\uFF10\uFF13"],
    ["an unquoted attribute", "id=A-03"],
    ["a key=value form", "addition=A-03"],
    ["a range of ids", "A-01-A-03"],
  ])("still catches a reference written with %s", (_label, text) => {
    expect(violationsFor(text).map((v) => v.id), text).toContain("A-03");
  });

  it("does not flag the Rice Knowledge Bank code or ordinary words", () => {
    expect(violationsFor("code=A-60O299W4F9")).toEqual([]);
    expect(violationsFor("Grade A-plus, an A grade")).toEqual([]);
  });

  describe("source lines", () => {
    const md = (source: string) =>
      `### A-01 — t\n- [ ] Approved by owner\n- **Goals:** G4\n- **Feature:** f\n${source}\n- **Exact claim:**\n  > ข้อความไทยทดสอบ\n- **How it was read:** x\n`;

    it("rejects a markdown-link source, which the old parser silently skipped", () => {
      const [a] = parseAdditions(md("- **Source:** [FAO](https://faolex.fao.org/x.pdf)"));
      expect(auditAddition(a!, [a!]).join(" ")).toMatch(/source/i);
    });

    it("rejects a bare-URL source", () => {
      const [a] = parseAdditions(md("- **Source:** https://faolex.fao.org/x.pdf"));
      expect(auditAddition(a!, [a!]).join(" ")).toMatch(/source/i);
    });

    it("checks every URL on the line, not only the first", () => {
      const [a] = parseAdditions(md("- **Source:** <https://www.doa.go.th/a.pdf> and <https://faolex.fao.org/x.pdf>"));
      expect(auditAddition(a!, [a!]).join(" ")).toMatch(/faolex/);
    });

    it("accepts 'same document as A-nn' only when that entry exists and has a URL", () => {
      const good = parseAdditions(
        md("- **Source:** <https://www.doa.go.th/a.pdf>") +
          md("- **Source:** the same document as A-01").replace("A-01 — t", "A-02 — t"),
      );
      expect(auditAddition(good[1]!, good)).toEqual([]);
      const dangling = parseAdditions(md("- **Source:** the same document as A-09"));
      expect(auditAddition(dangling[0]!, dangling).join(" ")).toMatch(/A-09/);
    });

    it("rejects an entry with no source line at all", () => {
      const [a] = parseAdditions(md(""));
      expect(auditAddition(a!, [a!]).join(" ")).toMatch(/source/i);
    });
  });

  describe("approval box", () => {
    const body = (extra: string, approval: string) =>
      `### A-01 — t\n${extra}${approval}\n- **Goals:** G4\n- **Feature:** f\n- **Source:** <https://www.doa.go.th/a.pdf>\n- **Exact claim:**\n  > ข้อความไทยทดสอบ\n- **How it was read:** x\n`;

    it("is not flipped by an earlier ticked checkbox that is not the approval", () => {
      const [a] = parseAdditions(body("- [x] note\n", "- [ ] Approved by owner"));
      expect(a!.approved).toBe(false);
      expect(auditAddition(a!, [a!]).join(" ")).toMatch(/checkbox/i);
    });

    it("requires exactly one approval line", () => {
      const [a] = parseAdditions(body("", "- [ ] Approved by owner\n- [x] Approved by owner"));
      expect(auditAddition(a!, [a!]).join(" ")).toMatch(/exactly one/i);
    });

    it("ignores headings and checkboxes inside a fenced code block", () => {
      const md = "```\n### A-02 — fake\n- [x] Approved by owner\n```\n" + body("", "- [ ] Approved by owner");
      const parsed = parseAdditions(md);
      expect(parsed.map((a) => a.id)).toEqual(["A-01"]);
    });

    it("reports a malformed heading instead of dropping the entry", () => {
      expect(malformedHeadings("### A-01 - hyphen not em dash\n")).toEqual(["### A-01 - hyphen not em dash"]);
      expect(malformedHeadings("### A-01 — fine\n")).toEqual([]);
    });
  });
});

describe("approved wording is not pasted into content without naming its id", () => {
  it("finds no distinctive string from an unticked entry anywhere in content/", () => {
    const files = contentFiles(CONTENT_DIR);
    for (const [id, strings] of Object.entries(GUARDED_STRINGS)) {
      if (ADDITIONS.find((a) => a.id === id)?.approved) continue;
      for (const needle of strings) {
        const hit = files.find(([, text]) => text.includes(needle));
        expect(hit?.[0], `${id}: "${needle}" appears in content before approval`).toBeUndefined();
      }
    }
  });

  it("has guarded strings for every entry that proposes numbers", () => {
    expect(Object.keys(GUARDED_STRINGS).length).toBeGreaterThanOrEqual(7);
  });

  it("would catch a paste", () => {
    // Synthetic entries, so this self-test cannot be broken by which real
    // entries the owner happens to have ticked.
    const planted = [["content/th/ch04.mdx", "ใส่ครั้งที่ 2 เมื่อข้าวโพดอายุ 21-30 วัน"]] as const;
    expect(findGuardedPastes([entry({ id: "A-04", approved: false })], planted).map((x) => x.id)).toEqual(["A-04"]);
    expect(findGuardedPastes([entry({ id: "A-04", approved: true })], planted)).toEqual([]);
  });
});
