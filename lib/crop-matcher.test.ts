import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CROP_GROUPS, cropChoices } from "./crop-matcher";
import { readChapters } from "./content";
import { RAW_TABLES, cropsFor, cropsForReading } from "./data";
import { readUiStrings } from "./ui";

const nospace = (s: string) => s.replace(/\s+/g, "");
const raw = (page: number) => nospace(readFileSync(join(process.cwd(), `docs/content/raw/p${String(page).padStart(2, "0")}.txt`), "utf8"));
const ch05 = readChapters("th").find((c) => c.frontmatter.chapter === 5)!;
const choices = cropChoices("th");
const crop = (id: string) => choices.find((c) => c.id === id)!;
const allGuidance = choices.flatMap((c) => c.rows.flatMap((r) => r.stages.flatMap((s) => [...s.actionable, ...s.descriptive])));

describe("the eight crops", () => {
  it("are exactly the ticket's eight, in a stable order", () => {
    expect(choices.map((c) => c.id)).toEqual(["rice", "maize", "cassava", "sugarcane", "rubber", "mango", "durian", "vegetables"]);
  });

  it("together cover all 10 rows of the p12–13 table exactly once", () => {
    const rows = choices.flatMap((c) => c.rows.map((r) => r.id));
    expect(rows).toHaveLength(10);
    expect(new Set(rows).size).toBe(10);
    expect(rows.sort()).toEqual(RAW_TABLES["other-crops"].rows.map((r) => r.id).sort());
  });

  it("are named in the pamphlet's own Thai", () => {
    const text = raw(5) + raw(12) + raw(13) + raw(4) + raw(3);
    for (const group of CROP_GROUPS) expect(text, group.label).toContain(nospace(group.label));
    for (const c of choices) for (const r of c.rows) expect(raw(12) + raw(13), r.label).toContain(nospace(r.label));
  });
});

describe("the tier filter (D9)", () => {
  const actionable = (id: string) => crop(id).rows.flatMap((r) => r.stages.flatMap((s) => s.actionable));

  it("shows as numbers exactly the guidance cropsFor() keeps, and nothing else", () => {
    const kept = cropsFor("th").flatMap((c) => [...c.basal, ...c.topDressing]).map((g) => g.text).sort();
    const shown = choices.flatMap((c) => c.rows.flatMap((r) => r.stages.flatMap((s) => s.actionable))).map((g) => g.text).sort();
    expect(shown).toEqual(kept);
  });

  it("splits cropsForReading() into actionable and descriptive with nothing lost or doubled", () => {
    const read = cropsForReading("th").flatMap((c) => [...c.basal, ...c.topDressing]).map((g) => g.text).sort();
    const shown = allGuidance.map((g) => g.text).sort();
    expect(shown).toEqual(read);
  });

  it("derives which crops have no reliable source: sugarcane, mango, both rubber rows, vegetables", () => {
    const unreliable = choices.filter((c) => !c.reliable).map((c) => c.id);
    expect(unreliable).toEqual(["sugarcane", "rubber", "mango", "vegetables"]);
    for (const row of crop("rubber").rows) expect(row.hasActionable, row.id).toBe(false);
  });

  it("keeps the crops that do have a reliable source: rice, maize, cassava (regional), durian", () => {
    expect(choices.filter((c) => c.reliable).map((c) => c.id)).toEqual(["rice", "maize", "cassava", "durian"]);
  });

  it("never turns commercial-only guidance into a number", () => {
    for (const id of ["sugarcane", "mango"]) {
      for (const g of crop(id).rows.flatMap((r) => r.stages.flatMap((s) => s.descriptive))) {
        expect(g.sources.every((s) => s.tier === "commercial"), `${id} ${g.key}`).toBe(true);
      }
      expect(actionable(id), id).toEqual([]);
    }
  });

  it("still gives a no-source crop its descriptive text, so it is not an empty crop", () => {
    for (const id of ["sugarcane", "mango", "rubber", "vegetables"]) {
      const text = crop(id).rows.flatMap((r) => r.stages.flatMap((s) => s.descriptive));
      expect(text.length, id).toBeGreaterThan(0);
    }
  });
});

describe("Cambodian guidance is unreachable (D11)", () => {
  it("has no KH-scoped item, and none of the Cambodian wording", () => {
    for (const g of allGuidance) expect(g.scope, g.key).not.toBe("KH");
    const everything = allGuidance.map((g) => g.text).join(" ");
    expect(everything).not.toContain("KH:");
    expect(everything).not.toContain("farmers use urea");
    expect(everything).not.toContain("190–330");
  });

  it("shows vegetables only as descriptive text, with its Cambodian-survey source named, never as numbers", () => {
    // The row's unattributed advice is allowed as reading (T-007); its only named source is the
    // Cambodian working paper, so the reader is told that rather than left to assume.
    const veg = crop("vegetables").rows[0]!.stages.flatMap((s) => [...s.actionable, ...s.descriptive]);
    expect(veg.length).toBeGreaterThan(0);
    for (const g of veg) expect(g.sources.map((s) => s.id), g.key).toEqual(["cdri-wp91"]);
    expect(crop("vegetables").rows[0]!.stages.flatMap((s) => s.actionable)).toEqual([]);
    expect(crop("vegetables").rows[0]!.stages.flatMap((s) => s.descriptive).every((g) => g.rate === null)).toBe(true);
  });
});

describe("each rate is exactly the table's", () => {
  const find = (rowId: string, stage: "basal" | "topDressing") =>
    choices.flatMap((c) => c.rows).find((r) => r.id === rowId)!.stages.find((s) => s.stage === stage)!;

  it("shows rice's rates as ranges in the source's unit", () => {
    expect(find("rice-clay", "basal").actionable[0]).toMatchObject({ rate: "20–25", unit: "kg/rai", grades: ["16-20-0", "18-22-0", "20-20-0"] });
    expect(find("rice-clay", "topDressing").actionable[0]).toMatchObject({ rate: "5–10", unit: "kg/rai", grades: ["46-0-0"] });
    expect(find("rice-sandy", "basal").actionable[0]).toMatchObject({ rate: "20–25", grades: ["16-16-8", "18-12-6", "16-8-8"] });
  });

  it("does not assume every rate is per rai: durian is per tree", () => {
    const durian = find("durian", "topDressing").actionable;
    expect(durian.map((g) => [g.rate, g.unit])).toEqual([
      ["1–3", "kg/tree"],
      ["1", "kg/tree"],
    ]);
  });

  it("gives maize's soil-test rule no invented number", () => {
    const [g] = find("maize", "basal").actionable;
    expect(g).toMatchObject({ rate: null, unit: null });
    expect(g!.text).toBe("15-15-15, 16-16-8, 16-8-8 or 20-10-5 by soil test");
  });

  it("shows cassava's one actionable figure with the source's own 'regional' wording, in kg/ha", () => {
    const [g] = find("cassava", "topDressing").actionable;
    expect(g).toMatchObject({ rate: "500–600", unit: "kg/ha", scope: "REGIONAL" });
    expect(g!.text).toContain("CIAT regional guidance");
  });

  it("keeps cassava's Thai figure descriptive, not actionable", () => {
    const d = find("cassava", "topDressing").descriptive.map((g) => g.text);
    expect(d).toEqual(["TH: 15-15-15 at 25–50 kg/rai at 30–45 days, 20 cm from plant."]);
  });

  it("repeats each item's wording exactly as stored (verbatim, untranslated)", () => {
    const stored = new Set(RAW_TABLES["other-crops"].rows.flatMap((r) => [...r.basal, ...r.topDressing]).map((g) => g.text));
    for (const g of allGuidance) expect(stored.has(g.text), g.text).toBe(true);
  });
});

describe("sources on each item", () => {
  it("resolve to a tier and a name", () => {
    for (const g of allGuidance) for (const s of g.sources) {
      expect(["official", "research", "commercial"]).toContain(s.tier);
      expect(s.name.length).toBeGreaterThan(0);
    }
  });

  it("marks linked markers separately from named-only sources, which have nothing to link to", () => {
    const rice = crop("rice").rows[0]!.stages[0]!.actionable[0]!;
    expect(rice.sources.map((s) => [s.id, s.linked])).toEqual([["tas-4401-2008", false], ["rice-dept", false]]);
    const durian = crop("durian").rows[0]!.stages[0]!.actionable[0]!;
    expect(durian.sources.map((s) => [s.id, s.linked, s.tier])).toEqual([["doa", true, "official"], ["doae", true, "official"]]);
  });

  it("links a marker only when chapter 5's sources list has it: cassava's dolomite blogspot is unlinked", () => {
    const dolomite = crop("cassava").rows[0]!.stages.find((s) => s.stage === "basal")!.descriptive[0]!;
    expect(dolomite.sources.map((s) => [s.id, s.linked, s.tier])).toEqual([["blogspot", false, "commercial"]]);
    for (const g of allGuidance) for (const s of g.sources) {
      if (s.linked) expect(ch05.frontmatter.citations, `${g.key} ${s.id}`).toContain(s.id);
    }
  });
});

describe("chapter 5's sources list matches what the matcher shows", () => {
  it("lists no marker that no visible item links to (the hidden Cambodian table's irri and cambridge are gone)", () => {
    const linked = new Set(allGuidance.flatMap((g) => g.sources.filter((s) => s.linked).map((s) => s.id)));
    for (const id of ch05.frontmatter.citations) expect(linked.has(id), `${id} is listed but nothing links to it`).toBe(true);
    expect(ch05.frontmatter.citations).not.toContain("irri");
    expect(ch05.frontmatter.citations).not.toContain("cambridge");
  });
});

describe("the matcher's words", () => {
  const ui = readUiStrings("th");
  it("uses the pamphlet's own terms for basal, top dressing and reference rate (pinned to the raw pages)", () => {
    expect(raw(5)).toContain(nospace(ui.cropBasal));
    expect(raw(5)).toContain(nospace(ui.cropTopDressing));
    expect(raw(3)).toContain(nospace(ui.cropRate));
    expect([ui.cropBasal, ui.cropTopDressing, ui.cropRate]).toEqual(["ปุ๋ยรองพื้น", "ปุ๋ยแต่งหน้า", "อัตราอ้างอิง"]);
  });
  it("says in words that a crop has no reliable source, and that reference text is not a recommended figure", () => {
    expect(ui.cropNoReliable).toContain("ไม่ใช่ตัวเลขที่แนะนำ");
    expect(ui.cropDescriptiveHeading).toContain("ไม่ใช่ตัวเลขที่แนะนำ");
  });
});
