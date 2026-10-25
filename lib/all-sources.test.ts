import { describe, expect, it } from "vitest";
import { allSources, chapterSources, namedSourcePages } from "./all-sources";
import { citationEntry, TIERS } from "./citations";
import { BIBLIOGRAPHY } from "./sources";

const groups = allSources(chapterSources("th"), namedSourcePages());
const listings = groups.flatMap((g) => g.sources);
const ids = listings.map((s) => s.entry.id);
const byId = (id: string) => listings.find((s) => s.entry.id === id)!;
const linked = (id: string) => byId(id).chapters.map(({ chapter, anchored }) => `${chapter}${anchored ? "#" : ""}`);

describe("allSources (T-055)", () => {
  it("is one group per tier, in the legend's order, none empty", () => {
    expect(groups.map((g) => g.tier)).toEqual([...TIERS]);
    for (const g of groups) expect(g.sources.length, g.tier).toBeGreaterThan(0);
  });

  it("lists every domain once, under its own tier", () => {
    expect(new Set(ids).size, "a source listed twice").toBe(ids.length);
    for (const d of BIBLIOGRAPHY.domains) expect(ids, d.id).toContain(d.id);
    for (const g of groups) for (const s of g.sources) expect(citationEntry(s.entry.id).tier, s.entry.id).toBe(g.tier);
  });

  it("lists every one of the pamphlet's 41 linked documents exactly once", () => {
    const urls = listings.flatMap((s) => s.entry.urls);
    expect(urls).toHaveLength(41);
    expect(new Set(urls)).toEqual(new Set(BIBLIOGRAPHY.documents.map((d) => d.url)));
  });

  it("lists the sources named without a link once each: 37 domains and 4 names, as oae is also a domain", () => {
    expect(listings).toHaveLength(41);
    for (const id of ["tas-4401-2008", "rice-dept", "cdri-wp91", "nakhon-sawan-fcrc"]) expect(byId(id).entry.urls, id).toEqual([]);
    expect(byId("oae").entry.urls).not.toEqual([]);
  });

  it("gives a source the pages of its documents and of the table rows that print its name, sorted, each once", () => {
    const doa = BIBLIOGRAPHY.documents.filter((d) => d.domain === "doa").flatMap((d) => d.pages);
    expect(byId("doa").pages).toEqual([...new Set(doa)].sort((a, b) => a - b));
    expect(byId("montana").pages).toEqual([15]);
    expect(byId("rice-dept").pages).toEqual([12]);
    expect(byId("cdri-wp91").pages).toEqual([13]);
    // A domain the p12 cassava cell also names: its document's page and the name's.
    expect(byId("oae").pages).toEqual([6, 12]);
    // A pill's guidance on p12 does not make p12 one of its pages: blogspot is printed on p5.
    expect(byId("blogspot").pages).toEqual([5]);
  });

  it("links the chapters that show a source; onto its entry (#) only where the chapter's sources list has one", () => {
    expect(linked("doa")).toEqual(["1#", "2#", "5#"]);
    expect(linked("fao")).toEqual(["2#", "4#", "5#"]);
    expect(linked("vietnamplus")).toEqual(["3#"]);
    // Chapter 5's crop matcher names these without an entry in its list.
    expect(linked("rice-dept")).toEqual(["5"]);
    expect(linked("oae")).toEqual(["4#", "5"]);
    expect(linked("blogspot")).toEqual(["2#", "5"]);
    // Cited in the pamphlet but shown by no chapter.
    expect(linked("irri")).toEqual([]);
  });

  it("takes a chapter's sources from what it is given, in chapter order", () => {
    const one = allSources([{ chapter: 9, citations: [], shown: ["irri"] }, { chapter: 3, citations: ["irri"] }]);
    expect(one.flatMap((g) => g.sources).find((s) => s.entry.id === "irri")!.chapters).toEqual([
      { chapter: 3, anchored: true },
      { chapter: 9, anchored: false },
    ]);
  });

  it("keeps the count of sources a pill hides, never their names", () => {
    expect(byId("uga").entry.unnamed).toBe(2);
    expect(byId("cgiar").entry.unnamed).toBe(3);
    expect(byId("doa").entry.unnamed).toBe(0);
  });

  it("orders each tier by name", () => {
    for (const g of groups) {
      const names = g.sources.map((s) => s.entry.name);
      expect(names, g.tier).toEqual([...names].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" })));
    }
  });

  it("fails on a chapter showing a source that is not in sources.json", () => {
    expect(() => allSources([{ chapter: 1, citations: ["nowhere"] }])).toThrow(/nowhere/);
    expect(() => allSources([{ chapter: 1, citations: [], shown: ["elsewhere"] }])).toThrow(/elsewhere/);
  });

  it("finds every name the tables print without a link, and only those", () => {
    const found = new Set(namedSourcePages().map((n) => n.id));
    expect(found).toEqual(new Set(BIBLIOGRAPHY.namedOnly.map((n) => n.id)));
  });
});
