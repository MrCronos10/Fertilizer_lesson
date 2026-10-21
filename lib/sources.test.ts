import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readChapters } from "./content";
import { RAW_TABLES, cropsFor, cropsForReading, type Guidance } from "./data";
import {
  BIBLIOGRAPHY,
  backingFor,
  domainFor,
  isActionable,
  namedSourceFor,
  type Tier,
} from "./sources";

/**
 * T-007 guards. The bibliography's URLs were read from the PDF's link
 * annotations, which are not in the repo (the PDF is git-ignored); what is in
 * the repo is the raw text extraction and `tools/build-sources.py`. These tests
 * tie the bibliography back to the first and pin it against drift.
 *
 * A first version checked counts and domain names but pinned no tier and no
 * URL, and a review showed four corruptions passing it: a news aggregator
 * promoted to official, a manufacturer promoted to research, two DOA document
 * URLs swapped, and a Cambodian survey promoted to official. Nothing asserted
 * any of them. The pins below exist for exactly that reason.
 */

const RAW_DIR = join(process.cwd(), "docs", "content", "raw");

function rawLines(page: number): string[] {
  return readFileSync(join(RAW_DIR, `p${String(page).padStart(2, "0")}.txt`), "utf8").split("\n");
}

const MARKERS = new Set(BIBLIOGRAPHY.domains.map((d) => d.id));

/** Pills on a committed raw page: a bare marker line, or an overflow pill. */
function pillsOnPage(page: number): string[] {
  return rawLines(page)
    .map((l) => l.trim().replace(/ \+\d+$/, ""))
    .filter((l) => MARKERS.has(l));
}

/** Every tier, written out. Changing a tier means changing it here too, on purpose. */
const PINNED_TIERS: Record<string, Tier> = {
  apkgroup: "commercial", bansuanporpeang: "commercial", blogspot: "commercial",
  cambridge: "research", cgiar: "research", decachem: "commercial", doa: "official",
  doae: "official", fao: "official", forwardplant: "commercial", garden: "commercial",
  groworganic: "commercial", growplants: "commercial", irri: "research",
  khaosod: "commercial", kpluss: "commercial", ku: "research", ldd: "official",
  mdpi: "research", montana: "research", naikham: "commercial",
  "nutrien-ekonomics": "commercial", oae: "official", phys: "commercial",
  raithep: "commercial", rakbankerd: "commercial", ricethailand: "official",
  sotus: "commercial", "tci-thaijo": "commercial", thmeythmey25: "commercial",
  tratruamkaset: "commercial", uga: "research", uspto: "commercial",
  vietnamplus: "commercial", wordpress: "commercial", yara: "commercial",
  yvpgroup: "commercial",
};

/**
 * SHA-256 over every `domain|url|page#index,…` line, sorted. Any change to any
 * URL, to which domain owns it, or to *where each pill sits* changes this. The
 * position matters: two DOA documents cited on the same page carry identical
 * `domain|url|pages` once swapped, so only each pill's position tells them
 * apart. To update it after a deliberate regeneration:
 *   node -e 'const s=require("./content/sources.json");console.log(require("crypto")
 *   .createHash("sha256").update(s.documents.map(d=>`${d.domain}|${d.url}|${d.occurrences
 *   .map(o=>o.page+"#"+o.index).join(",")}`).sort().join("\n")).digest("hex"))'
 */
const DOCUMENTS_FINGERPRINT = "0a2a89de581b007115d85e77817317cf3f3b7f67ab040e7e6df2cb37a4f3e8bf";

describe("pill census", () => {
  it("reproduces the source's own count of 67 inline links", () => {
    expect(BIBLIOGRAPHY.pillCensus).toEqual({
      pills: 67,
      documents: 41,
      domains: 37,
      hiddenBehindOverflow: 5,
    });
  });

  it("accounts for exactly 67 occurrences across the document list", () => {
    expect(BIBLIOGRAPHY.documents.reduce((n, d) => n + d.pages.length, 0)).toBe(67);
    expect(BIBLIOGRAPHY.documents).toHaveLength(41);
    expect(BIBLIOGRAPHY.domains).toHaveLength(37);
  });

  it("agrees with every committed raw page, pill for pill", () => {
    // Pages 8–10 are Khmer and were not committed (T-005); they are covered by
    // the census total and by the fingerprint. Every other page is checked here.
    for (const page of [1, 2, 3, 4, 5, 6, 7, 11, 12, 13, 14, 15]) {
      const fromBibliography = BIBLIOGRAPHY.documents
        .flatMap((d) => d.pages.filter((p) => p === page).map(() => d.domain))
        .sort();
      expect(fromBibliography, `p${page} pills disagree with the raw extraction`).toEqual(
        pillsOnPage(page).sort(),
      );
    }
  });

  it("puts every pill at the position the raw page prints it", () => {
    // Stronger than counting: the pill at index i of a committed page must
    // belong to the domain the bibliography assigns to that slot, so a swap
    // across domains or a reordering fails even when the counts still add up.
    const COMMITTED = new Set([1, 2, 3, 4, 5, 6, 7, 11, 12, 13, 14, 15]);
    for (const doc of BIBLIOGRAPHY.documents) {
      for (const { page, index } of doc.occurrences) {
        if (!COMMITTED.has(page)) continue;
        expect(pillsOnPage(page)[index], `p${page} pill ${index} (${doc.url})`).toBe(doc.domain);
      }
      expect(doc.occurrences.map((o) => o.page)).toEqual(doc.pages);
    }
  });

  it("records the two overflow pills and the five sources hidden behind them", () => {
    expect(BIBLIOGRAPHY.unresolvedOverflow).toEqual([
      expect.objectContaining({ anchoredTo: "uga", page: 2, hiddenSources: 2 }),
      expect.objectContaining({ anchoredTo: "cgiar", page: 12, hiddenSources: 3 }),
    ]);
    expect(rawLines(2).some((l) => l.trim() === "uga +2")).toBe(true);
    expect(rawLines(12).some((l) => l.trim() === "cgiar +3")).toBe(true);
  });

  it("carries the overflow count onto the data row it belongs to", () => {
    expect(RAW_TABLES["other-crops"].rows.find((r) => r.id === "cassava")?.citationsMore).toBe(3);
  });
});

describe("the bibliography is pinned", () => {
  it("fingerprints every document URL, owner and page", () => {
    const lines = BIBLIOGRAPHY.documents
      .map((d) => `${d.domain}|${d.url}|${d.occurrences.map((o) => `${o.page}#${o.index}`).join(",")}`)
      .sort()
      .join("\n");
    expect(createHash("sha256").update(lines).digest("hex")).toBe(DOCUMENTS_FINGERPRINT);
  });

  it("pins every tier", () => {
    const actual = Object.fromEntries(BIBLIOGRAPHY.domains.map((d) => [d.id, d.tier]));
    expect(actual).toEqual(PINNED_TIERS);
  });

  it("ties each DOA document to the row whose pill it is", () => {
    // Same-domain swaps pass every domain-name check, so these are pinned by
    // position. On p12 the pills run fao, doa, ricethailand, cgiar, yara,
    // naikham, apkgroup, tci-thaijo, rakbankerd, doa, doae — so index 1 is the
    // maize row's DOA pill and index 9 is the durian row's.
    const at = (page: number, index: number) =>
      BIBLIOGRAPHY.documents.find((d) => d.occurrences.some((o) => o.page === page && o.index === index));
    expect(at(12, 1)?.url).toContain("oard5/wp-content/uploads/2019/09/km62.pdf");
    expect(at(12, 9)?.url).toContain("share/attachment.php?aid=2973");
    expect(at(2, 0)?.url).toContain("fc/nakhonsawan/?p=3660");
    expect(pillsOnPage(12)[1]).toBe("doa");
    expect(pillsOnPage(12)[9]).toBe("doa");
  });

  it("keeps the two Khaosod and two Montana documents distinct", () => {
    const urls = (domain: string) =>
      BIBLIOGRAPHY.documents.filter((d) => d.domain === domain).map((d) => d.url);
    expect(urls("khaosod")).toHaveLength(2);
    expect(urls("montana")).toHaveLength(2);
    expect(new Set(urls("khaosod")).size).toBe(2);
  });
});

describe("domains and documents", () => {
  it.each(BIBLIOGRAPHY.domains)("$id has a tier, a rationale and at least one document", (d) => {
    expect(["official", "research", "commercial"]).toContain(d.tier);
    expect(d.rationale.trim().length).toBeGreaterThan(10);
    expect(d.documents.length).toBeGreaterThan(0);
    expect(["domain", "inferred-from-url"]).toContain(d.basis);
  });

  it("lists every document under the domain it claims, with a real URL", () => {
    for (const doc of BIBLIOGRAPHY.documents) {
      expect(doc.url).toMatch(/^https?:\/\//);
      expect(domainFor(doc.domain)?.documents, doc.url).toContain(doc.url);
      expect(doc.pages.length).toBeGreaterThan(0);
    }
  });

  it("never lets a URL-inferred tier rise above commercial", () => {
    // Nothing was fetched to decide a tier. Where one rests on inspecting a URL
    // alone, the only safe outcome is the lowest: an inference must never
    // promote a source into something a rate can be acted on from.
    for (const d of BIBLIOGRAPHY.domains.filter((x) => x.basis === "inferred-from-url")) {
      expect(d.tier, `${d.id} was promoted on inference alone`).toBe("commercial");
    }
  });

  it("holds the Thai government domains as official", () => {
    for (const id of ["doa", "doae", "ldd", "oae", "ricethailand"]) {
      expect(domainFor(id)?.tier, id).toBe("official");
    }
  });
});

describe("every citation in the corpus resolves", () => {
  it("every marker a chapter declares has a bibliography entry", () => {
    for (const { file, frontmatter } of readChapters("th")) {
      for (const marker of frontmatter.citations) {
        expect(domainFor(marker), `${file}: "${marker}" is not in sources.json`).toBeDefined();
      }
    }
  });

  it("every marker a data row declares has a bibliography entry", () => {
    for (const [id, table] of Object.entries(RAW_TABLES)) {
      for (const row of table.rows) {
        for (const marker of row.citations ?? []) {
          expect(domainFor(marker), `${id}/${row.id}: "${marker}"`).toBeDefined();
        }
      }
    }
  });

  const guidances = RAW_TABLES["other-crops"].rows.flatMap((row) =>
    [...row.basal, ...row.topDressing].map((g, i) => ({ row, g, at: `${row.id}[${i}]` })),
  );

  it.each(guidances)("$at resolves to at least one source", ({ g, at }) => {
    expect(backingFor(g).length, `${at} has no source at all`).toBeGreaterThan(0);
  });

  it("rejects a citation with no bibliography entry rather than guessing a tier", () => {
    expect(() => backingFor({ citations: ["no-such-source"], namedSources: [] })).toThrow(
      /no entry in sources.json/,
    );
    expect(() => backingFor({ citations: [], namedSources: ["no-such-name"] })).toThrow(
      /no entry in sources.json/,
    );
  });

  it("records every named-only source against a row that exists, with no URL", () => {
    const rowIds = RAW_TABLES["other-crops"].rows.map((r) => r.id);
    for (const named of BIBLIOGRAPHY.namedOnly) {
      expect(named.url).toBeNull();
      for (const rowId of named.citedFor) expect(rowIds).toContain(rowId);
    }
  });

  it("pins every named-only source's tier and whether it may lift", () => {
    expect(
      Object.fromEntries(BIBLIOGRAPHY.namedOnly.map((n) => [n.id, [n.tier, n.liftsActionability]])),
    ).toEqual({
      "tas-4401-2008": ["official", true],
      "rice-dept": ["official", true],
      "cdri-wp91": ["research", true],
      "nakhon-sawan-fcrc": ["official", false],
      oae: ["official", false],
    });
  });

  it("lets a name lift a rate only in a cell that has no pill at all", () => {
    // TAS 4401-2008 and the Rice Department stand alone in the clay-soil rice
    // cell. The cassava cell names two authorities beside a pill that belongs
    // to the CIAT line, so those names attach nothing to the Thai rate.
    expect(namedSourceFor("tas-4401-2008")?.liftsActionability).toBe(true);
    expect(namedSourceFor("rice-dept")?.liftsActionability).toBe(true);
    expect(namedSourceFor("nakhon-sawan-fcrc")?.liftsActionability).toBe(false);
    expect(namedSourceFor("oae")?.liftsActionability).toBe(false);
  });
});

describe("actionability (D9)", () => {
  const guidances = RAW_TABLES["other-crops"].rows.flatMap((row) =>
    [...row.basal, ...row.topDressing].map((g, i) => ({ row, g, at: `${row.id}[${i}]` })),
  );

  it.each(guidances)("$at: the stored flag matches the rule", ({ g, at }) => {
    expect(g.actionable, `${at} is stored as ${g.actionable}`).toBe(isActionable(g));
  });

  it("pins exactly which guidance is actionable", () => {
    const actionable = guidances.filter(({ g }) => g.actionable).map(({ row, g }) => `${row.id}:${g.scope}`);
    expect(actionable.sort()).toEqual([
      "cassava:REGIONAL",
      "durian:TH",
      "durian:TH",
      "maize:TH",
      "maize:TH",
      "rice-clay:TH",
      "rice-clay:TH",
      "rice-sandy:TH",
      "rice-sandy:TH",
    ]);
  });

  it("does not let cassava's Thai rates ride on the CIAT pill", () => {
    // The review's headline finding. The p12 cassava row carries one pill,
    // `cgiar +3`, and it sits beside the CIAT line. The Thai dolomite rate is
    // backed on p5 by a blogspot page, and the Thai 15-15-15 rate names two
    // authorities that have no link — so neither may be actionable.
    const cassava = RAW_TABLES["other-crops"].rows.find((r) => r.id === "cassava")!;
    const dolomite = cassava.basal.find((g) => g.text.startsWith("Dolomite"))!;
    const thai = cassava.topDressing.find((g) => g.text.startsWith("TH:"))!;
    const ciat = cassava.topDressing.find((g) => g.scope === "REGIONAL")!;
    expect(backingFor(dolomite).map((b) => b.id)).toEqual(["blogspot"]);
    expect(dolomite.actionable).toBe(false);
    expect(thai.actionable).toBe(false);
    expect(ciat.actionable).toBe(true);
    expect(backingFor(ciat).map((b) => b.id)).toEqual(["cgiar"]);
  });

  it("flags exactly the Thai guidance the source admits rests on labels or summaries, and more", () => {
    // The source's own caveat names sugarcane, mango and tapped rubber. The
    // rule also blocks cassava's two Thai lines and tapped rubber, whose only
    // backing is a hosting platform and an unfetched journal.
    const blocked = guidances
      .filter(({ g }) => !g.actionable && g.scope === "TH")
      .map(({ row, g }) => `${row.id}:${g.text.slice(0, 10)}`);
    expect(new Set(blocked.map((b) => b.split(":")[0]))).toEqual(
      new Set(["cassava", "mango", "rubber-immature", "rubber-tapped", "sugarcane"]),
    );
  });

  it("never treats Cambodian or unattributed guidance as actionable", () => {
    for (const { g, at } of guidances) {
      if (g.scope === "KH" || g.scope === "UNSTATED") expect(g.actionable, at).toBe(false);
    }
  });

  it("the crop matcher returns no non-actionable guidance", () => {
    for (const { row, basal, topDressing } of cropsFor("th")) {
      for (const g of [...basal, ...topDressing]) {
        expect(g.actionable, `${row.id} leaked non-actionable guidance`).toBe(true);
      }
    }
  });

  it("still lets the descriptive reading path show what the matcher hides", () => {
    const count = (crops: ReturnType<typeof cropsFor>, id: string): number => {
      const c = crops.find((x) => x.row.id === id);
      return (c?.basal.length ?? 0) + (c?.topDressing.length ?? 0);
    };
    for (const id of ["sugarcane", "mango", "rubber-immature", "rubber-tapped"]) {
      expect(count(cropsFor("th"), id), `${id} should have no actionable guidance`).toBe(0);
      expect(count(cropsForReading("th"), id), `${id} should stay readable`).toBeGreaterThan(0);
    }
  });

  it("is a strongest-link rule: one non-commercial source lifts, any number of commercial ones do not", () => {
    const base = { scope: "TH" } as Guidance;
    const rule = (citations: string[], namedSources: string[] = []) =>
      isActionable({ ...base, citations, namedSources } as Guidance);
    expect(rule(["yara"])).toBe(false);
    expect(rule(["yara", "naikham", "apkgroup", "rakbankerd"])).toBe(false);
    expect(rule(["yara", "doa"])).toBe(true);
    expect(rule(["irri"])).toBe(true);
    expect(rule([], ["tas-4401-2008"])).toBe(true);
    expect(rule([], ["oae"])).toBe(false); // named beside another line's pill: attaches nothing
  });

  it("a hosting platform's tier cannot lift a rate it was only inferred to deserve", () => {
    expect(domainFor("tci-thaijo")?.basis).toBe("inferred-from-url");
    const tapped = RAW_TABLES["other-crops"].rows.find((r) => r.id === "rubber-tapped")!;
    expect(tapped.topDressing.every((g) => !g.actionable)).toBe(true);
  });
});
