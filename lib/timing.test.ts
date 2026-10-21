import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TimingDiagram } from "../components/TimingDiagram";
import { readChapters } from "./content";
import { RAW_TABLES } from "./data";
import { STAGES, riceRates } from "./timing";
import { readUiStrings } from "./ui";

const ui = readUiStrings("th");
const nospace = (s: string) => s.replace(/\s+/g, "");
const raw = (page: number) => nospace(readFileSync(join(process.cwd(), `docs/content/raw/p${String(page).padStart(2, "0")}.txt`), "utf8"));
const ch02 = readChapters("th").find((c) => c.frontmatter.chapter === 2)!;
const html = renderToStaticMarkup(createElement(TimingDiagram, { ui }));

describe("the two definitions are the pamphlet's §2.7, word for word", () => {
  it("each term and sentence is on p5, in order, and in chapter 2's bullets", () => {
    for (const s of STAGES) {
      const sentence = nospace(`${s.term}:${s.lines.join(" ")}`);
      expect(raw(5), s.id).toContain(sentence);
      expect(nospace(ch02.body.replace(/\*\*/g, "")), s.id).toContain(sentence);
    }
  });

  it("splits a sentence into lines only at the pamphlet's own spaces (the lines rejoin to it exactly)", () => {
    const bullets = ch02.body.split("\n").filter((l) => l.startsWith("- **ปุ๋ย"));
    expect(bullets).toHaveLength(2);
    STAGES.forEach((s, i) => {
      expect(bullets[i]!.replace(/^- \*\*(.*?):\*\* /, "$1|")).toBe(`${s.term}|${s.lines.join(" ")}`);
    });
  });
});

describe("the Thai rates come from the data and nobody else", () => {
  const rates = riceRates("th");

  it("are the rice rows' actionable Thai per-area guidance: basal 20–25 kg/rai, urea 5–10 kg/rai", () => {
    expect(rates.basal.map((r) => [r.label, r.grades, r.rate, r.unit])).toEqual([
      ["ข้าว ดินเหนียว", "16-20-0 / 18-22-0 / 20-20-0", "20–25", "kg/rai"],
      ["ข้าว ดินทราย", "16-16-8 / 18-12-6 / 16-8-8", "20–25", "kg/rai"],
    ]);
    expect(rates.topDressing.map((r) => [r.label, r.grades, r.rate, r.unit])).toEqual([
      ["ข้าว ดินเหนียว", "46-0-0", "5–10", "kg/rai"],
      ["ข้าว ดินทราย", "46-0-0", "5–10", "kg/rai"],
    ]);
  });

  it("are exactly the stored numbers", () => {
    const rows = RAW_TABLES["other-crops"].rows.filter((r) => r.id.startsWith("rice-"));
    for (const row of rows) {
      const g = row.basal[0]!;
      expect(g.rate).toEqual({ min: 20, max: 25 });
      expect(row.topDressing[0]!.rate).toEqual({ min: 5, max: 10 });
    }
  });

  it("stay Thai-only: no Cambodian rice figure (kg/ha) and no per-tree rate can appear", () => {
    for (const r of [...rates.basal, ...rates.topDressing]) expect(r.unit).toBe("kg/rai");
    expect(html).not.toMatch(/kg\/ha|kg\/tree/);
  });
});

describe("the diagram as rendered", () => {
  it("is one static SVG image: named, described, and with nothing that moves", () => {
    expect(html).toContain('role="img"');
    expect(html).toMatch(/aria-labelledby="timing-title-\w+ timing-desc-\w+"/);
    expect(html).toMatch(/<title id="timing-title-\w+">ปุ๋ยรองพื้น \/ ปุ๋ยแต่งหน้า<\/title>/);
    expect(html).not.toMatch(/<animate|<set |animateTransform|<script|<foreignObject|<image|<input|type="range"/);
  });

  it("has every word as real SVG text, and the same words in the description", () => {
    const texts = [...html.matchAll(/<text [^>]*>(.*?)<\/text>/g)].map((m) => m[1]);
    const desc = /<desc id="timing-desc-\w+">(.*?)<\/desc>/.exec(html)?.[1] ?? "";
    expect(texts.length).toBeGreaterThan(10);
    for (const t of texts) expect(desc, t).toContain(t);
    for (const s of STAGES) for (const line of [s.term, ...s.lines]) expect(texts).toContain(line);
  });

  it("names its pages, shows tier-badged sources and carries the soil-test note", () => {
    expect(html).toContain(`ปุ๋ยรองพื้น / ปุ๋ยแต่งหน้า: ${ui.pamphletPages}: 5`);
    expect(html).toContain("data-tier=");
    expect(html).toContain(ui.soilTestNote);
  });

  it("gives each rice row its own sources: Rice Department only on the clay row, FAO only on the sandy row", () => {
    const row = (label: string) => new RegExp(`<li data-row-label="${label}">(.*?)</li>`).exec(html)?.[1] ?? "";
    const clay = row("ข้าว ดินเหนียว");
    const sandy = row("ข้าว ดินทราย");
    expect(clay).toContain("Rice Department");
    expect(clay).toContain("TAS 4401-2008");
    expect(clay).not.toContain("FAO");
    expect(sandy).toContain("FAO");
    expect(sandy).not.toContain("Rice Department");
    expect(sandy).not.toContain("TAS 4401-2008");
  });

  it("says no sequence the source does not: no arrow, no marker", () => {
    expect(html).not.toMatch(/<marker|marker-end|markerEnd|<line /);
  });

  it("reads the description as one sentence per panel, never splitting เช่น from its example", () => {
    const desc = /<desc id="[^"]+">(.*?)<\/desc>/.exec(html)?.[1] ?? "";
    expect(desc).toContain("เช่น ยูเรียตอนข้าวแตกกอหรือตั้งท้อง");
    expect(desc).not.toContain("เช่น.");
    // Two panels, and four rate groups (clay and sandy, for each stage).
    expect(desc.split(". ")).toHaveLength(2 + 4);
  });

  it("links a source only if chapter 2's list has it, and never to a missing entry", () => {
    const linked = [...html.matchAll(/data-cite="([^"]+)"/g)].map((m) => m[1]);
    for (const id of linked) expect(ch02.frontmatter.citations, id).toContain(id);
    expect(linked).toContain("fao");
  });
});
