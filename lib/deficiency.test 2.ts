import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { deficiencyGroups } from "./deficiency";
import { numsFor } from "./nums";
import { readUiStrings } from "./ui";

// Whitespace is dropped on both sides: the PDF text layer puts spaces around "/" and "(" that the cleaned JSON does not.
const nospace = (s: string) => s.replace(/\s+/g, "");
const RAW = nospace(readFileSync(join(__dirname, "../docs/content/raw/p03.txt"), "utf8"));
const CH01 = readFileSync(join(__dirname, "../content/th/ch01.mdx"), "utf8");
const squash = (s: string) => s.replace(/\s+/g, " ").trim();

describe("deficiencyGroups", () => {
  const groups = deficiencyGroups();
  const by = Object.fromEntries(groups.map((g) => [g.id, g.entries.map((e) => e.elements)]));

  it("reaches all 10 rows of the p3 table exactly once", () => {
    const all = groups.flatMap((g) => g.entries.map((e) => e.id));
    expect(all).toHaveLength(10);
    expect(new Set(all).size).toBe(10);
  });

  it("puts the mobile elements under old leaves, as the source's sentence says", () => {
    expect(by.old).toEqual(["N", "P", "K", "Mg"]);
  });

  it("puts the immobile elements under young leaves", () => {
    expect(by.young).toEqual(["S", "Ca", "Fe / Mn", "B"]);
  });

  it("keeps Zn and Cu / Mo apart because the source does not place them", () => {
    expect(by.unplaced).toEqual(["Zn", "Cu / Mo"]);
  });

  it("agrees with the sentence in chapter 1 about which elements are which", () => {
    const sentence = squash(CH01);
    expect(sentence).toContain("ธาตุที่เคลื่อนที่ได้ในพืช (N, P, K, Mg) แสดงอาการที่ **ใบแก่** ก่อน");
    expect(sentence).toContain("ธาตุที่เคลื่อนที่ไม่ได้ (Fe, Ca, B, S, Mn) แสดงอาการที่ **ใบอ่อน/ยอด** ก่อน");
  });

  it("shows each symptom as the pamphlet's p3 prints it (ignoring spacing)", () => {
    for (const entry of groups.flatMap((g) => g.entries)) {
      expect(RAW, entry.id).toContain(nospace(entry.symptom));
      expect(entry.sourcePage).toBe(3);
    }
  });
});

describe("the explorer's words", () => {
  const ui = readUiStrings("th");
  const rules = numsFor(1).map((n) => n.text);

  it("states the mobility rule in the source's own sentences (the figures pinned to p2)", () => {
    expect(rules).toContain(ui.defRuleOld);
    expect(rules).toContain(ui.defRuleYoung);
    expect(numsFor(1).filter((n) => [ui.defRuleOld, ui.defRuleYoung].includes(n.text)).every((n) => n.sourcePage === 2)).toBe(true);
  });

  it("uses the source's own terms for the two leaf classes", () => {
    const chapter = squash(CH01).replace(/\*\*/g, "");
    expect(chapter).toContain(ui.defOld);
    expect(chapter).toContain(ui.defYoung);
    expect(ui.defOld).toBe("ใบแก่");
    expect(ui.defYoung).toBe("ใบอ่อน/ยอด");
  });

  it("uses the source's own p3 heading and chapter label", () => {
    expect(nospace(readFileSync(join(__dirname, "../docs/content/raw/p03.txt"), "utf8"))).toContain(nospace(`ธาตุ ${ui.colSymptom}`));
    expect(squash(CH01)).toContain(`**${ui.defTableCaption}:**`);
  });
});
