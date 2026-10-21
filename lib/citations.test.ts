import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RateBlock } from "../components/Rate";
import { Sources, TierBadge, makeCite, pageRanges } from "../components/Citations";
import { citationEntry, TIERS } from "./citations";
import { citeIds, readChapters, textStream } from "./content";
import { BIBLIOGRAPHY } from "./sources";
import { readUiStrings } from "./ui";

const ui = readUiStrings("th");
const ROOT = process.cwd();

describe("citation resolution", () => {
  const chapters = readChapters("th");

  it("resolves every inline <Cite> and every frontmatter citation", () => {
    let seen = 0;
    for (const c of chapters) {
      for (const id of [...citeIds(c.body), ...c.frontmatter.citations]) {
        expect(() => citationEntry(id), `${c.file}: ${id}`).not.toThrow();
        seen++;
      }
    }
    expect(seen).toBeGreaterThan(30);
  });

  it("rejects an unknown marker instead of rendering a dead citation", () => {
    expect(() => citationEntry("not-a-source")).toThrow(/no entry/);
  });

  it("carries the tier recorded in sources.json, never a default", () => {
    for (const d of BIBLIOGRAPHY.domains) expect(citationEntry(d.id).tier).toBe(d.tier);
    expect(citationEntry("blogspot").tier).toBe("commercial");
    expect(citationEntry("doa").tier).toBe("official");
  });

  it("counts overflow sources without naming them", () => {
    expect(citationEntry("uga").unnamed).toBe(2);
    expect(citationEntry("cgiar").unnamed).toBe(3);
    expect(citationEntry("doa").unnamed).toBe(0);
  });

  it("names every source a chapter lists in the sources section", () => {
    for (const c of chapters) {
      for (const id of c.frontmatter.citations) expect(citationEntry(id).name.length).toBeGreaterThan(0);
    }
  });
});

describe("tier badge", () => {
  it.each(TIERS)("%s carries text and a shape, not colour alone", (tier) => {
    const html = renderToStaticMarkup(TierBadge({ tier, ui }));
    const text = html.replace(/<[^>]+>/g, "");
    expect(text).toMatch(/[◆●▲]/u);
    expect(text).toContain(ui.tierLabel);
    const label = { official: ui.tierOfficial, research: ui.tierResearch, commercial: ui.tierCommercial }[tier];
    expect(text).toContain(label);
    expect(html).toContain(`data-tier="${tier}"`);
  });

  it("gives each tier a different label and shape", () => {
    const render = (t: (typeof TIERS)[number]) => renderToStaticMarkup(TierBadge({ tier: t, ui })).replace(/<[^>]+>/g, "");
    expect(new Set(TIERS.map(render)).size).toBe(3);
  });
});

describe("soil-test note", () => {
  it("is the source's own p3 sentence, not new wording", () => {
    const raw = readFileSync(join(ROOT, "docs/content/raw/p03.txt"), "utf8");
    expect(textStream(raw)).toContain(textStream(ui.soilTestNote));
  });

  it("is the whole sentence, not a fragment of it", () => {
    expect(ui.soilTestNote).toBe("ควรส่งดินตรวจที่สถานีพัฒนาที่ดินจังหวัดก่อนเติมปุ๋ย");
  });

  it("rides with every rate block", () => {
    const html = renderToStaticMarkup(RateBlock({ ui, children: "x" }));
    expect(html).toContain(ui.soilTestNote);
    expect(html).toContain("data-rate");
  });

  it("is the only place a rate is marked up", () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((n) => {
        const p = join(dir, n);
        if (n === "node_modules" || n === ".next") return [];
        return statSync(p).isDirectory() ? walk(p) : /\.tsx$/.test(n) ? [p] : [];
      });
    const offenders = [...walk(join(ROOT, "app")), ...walk(join(ROOT, "components"))].filter(
      (f) => !f.endsWith("components/Rate.tsx") && /data-rate/.test(readFileSync(f, "utf8")),
    );
    expect(offenders).toEqual([]);
  });
});

describe("sources section", () => {
  const chapters = readChapters("th");
  const text = (html: string) => html.replace(/<[^>]+>/g, "");

  it("lists exactly the chapter's frontmatter citations, once each", () => {
    for (const c of chapters) {
      expect(new Set(c.frontmatter.citations).size, `${c.file} repeats a citation`).toBe(c.frontmatter.citations.length);
      const html = renderToStaticMarkup(Sources({ chapter: c, ui }));
      const ids = [...html.matchAll(/<li id="src-([^"]+)"/g)].map((m) => m[1]);
      expect(ids, c.file).toEqual([...c.frontmatter.citations]);
    }
  });

  it("only cites inline what the chapter's sources section lists", () => {
    for (const c of chapters) {
      for (const id of citeIds(c.body)) expect(c.frontmatter.citations, `${c.file}: ${id}`).toContain(id);
    }
  });

  it("shows the overflow count beside the source it hangs off", () => {
    const ch01 = chapters.find((c) => c.frontmatter.chapter === 1)!;
    const sources = text(renderToStaticMarkup(Sources({ chapter: ch01, ui })));
    expect(sources).toContain(`+2 ${ui.unnamedSources}`);
    const Cite = makeCite(ui);
    expect(text(renderToStaticMarkup(Cite({ id: "uga", more: 2 })))).toContain("+2");
  });

  it("gives each tier its own shape, in the section as well as inline", () => {
    const shape = (t: (typeof TIERS)[number]) => /[◆●▲]/u.exec(text(renderToStaticMarkup(TierBadge({ tier: t, ui }))))?.[0];
    expect([shape("official"), shape("research"), shape("commercial")]).toEqual(["◆", "●", "▲"]);
  });

  it("names the source before the link text, so out-of-context reading says what it is", () => {
    const html = renderToStaticMarkup(makeCite(ui)({ id: "doa" }));
    expect(text(html).startsWith(ui.sources)).toBe(true);
  });

  it("names the page range without hiding a gap", () => {
    expect(pageRanges([3, 4, 5])).toBe("3–5");
    expect(pageRanges([6, 7])).toBe("6–7");
    expect(pageRanges([2])).toBe("2");
    expect(pageRanges([3, 4, 9])).toBe("3–4, 9");
  });
});
