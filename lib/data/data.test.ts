import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { textStream } from "../content";
import {
  RAW_TABLES,
  TABLE_IDS,
  assertTables,
  audienceFor,
  cropsFor,
  deficiencyRows,
  formatGrade,
  formatQuantity,
  glossaryRows,
  organicFertilizers,
  riceSoilGroups,
  showsFirstOn,
  type TableId,
} from "./index";

/**
 * T-006 guards.
 *
 * The first version of this file checked row counts, internal consistency and
 * whether a Thai label appeared *somewhere on its page*. A review proved seven
 * corrupting mutations passed all of it — a swapped NPK pair, a 10× rate, two
 * symptom strings exchanged between rows. Whole-page containment cannot catch
 * a permutation, because every string is still on the page.
 *
 * So the checks here are **anchored**: a row's fields must appear together, in
 * order, on the single raw line the row came from. That is what ties a number
 * to its own row rather than to the page, and it is why most of these tests
 * are written per table instead of generically — the source's own line
 * structure is the evidence.
 */

const RAW_DIR = join(process.cwd(), "docs", "content", "raw");
const DATA_DIR = join(process.cwd(), "content", "data");

/** Row counts taken from the source inventory, not from the files. */
const EXPECTED_ROWS: Record<TableId, number> = {
  "nutrient-groups": 3,
  "deficiency-symptoms": 10,
  "organic-fertilizer-npk": 5,
  "straight-fertilizers": 7,
  "compound-grades": 6,
  "soil-conditioners": 4,
  "rice-by-soil-group-kh": 9,
  "other-crops": 10,
  glossary: 20,
};

/**
 * Cells the extractor splits across the p12/p13 page break. Each entry must
 * rebuild its `text` exactly when joined with a single space, which the test
 * asserts — the list can declare where a cell was cut, never what it says.
 */
const SPLIT_ACROSS_PAGES: Record<string, readonly string[]> = {
  "vegetables[0]": ["Manure or compost + a little", "DAP / 15-15-15"],
};

/** Straight fertilizers the crop table names in prose rather than by grade. */
const NAMED_FERTILIZERS: Record<string, readonly string[]> = {
  "46-0-0": ["Urea", "urea"],
  "18-46-0": ["DAP"],
};

function rawLines(pages: readonly number[]): string[] {
  return pages.flatMap((p) =>
    readFileSync(join(RAW_DIR, `p${String(p).padStart(2, "0")}.txt`), "utf8").split("\n"),
  );
}

/**
 * The citation markers the source prints, listed explicitly rather than
 * matched by shape. A shape rule (`^[a-z][a-z0-9.-]*$`) also swallows real
 * content: the crop table has cells that wrap onto lines reading just "hole",
 * "compost" and "doses".
 */
const CITATION_MARKERS = new Set([
  "apkgroup", "bansuanporpeang", "blogspot", "cambridge", "cgiar", "decachem", "doa", "doae",
  "fao", "forwardplant", "garden", "groworganic", "growplants", "irri", "khaosod", "kpluss",
  "ku", "ldd", "mdpi", "montana", "naikham", "nutrien-ekonomics", "oae", "phys", "raithep",
  "rakbankerd", "ricethailand", "sotus", "tci-thaijo", "thmeythmey25", "tratruamkaset",
  "uga", "uspto", "vietnamplus", "wordpress", "yara", "yvpgroup",
]);

/** `doa`, or an overflow pill such as `cgiar +3`. */
function isCitationFooter(line: string): boolean {
  return CITATION_MARKERS.has(line.replace(/ \+\d+$/, ""));
}
/** Clipped link text the extractor leaves stranded on its own line. */
const ORPHAN_FRAGMENT = /^(ที่|ทั้|อื่)$/;

/**
 * The page text a table was read from, with the same things removed that
 * SOURCES.md already records as dropped: the per-page citation-marker footer
 * (R9), orphaned fragments of clipped link text (R9), and a column header
 * repeated as a running header on a continuation page (R18).
 *
 * This matters for more than tidiness. The vegetable row's basal cell reads
 * "Manure or compost + a little" at the foot of p12 and "DAP / 15-15-15" at
 * the top of p13, with eleven citation markers and a repeated header printed
 * in between. Those are page furniture, not text; leaving them in would make
 * a correctly transcribed cell look wrong.
 */
function rawPage(pages: readonly number[]): string {
  const lines = rawLines(pages);
  const headerAt = lines.findIndex((l) => l.includes("Source"));
  const header = headerAt === -1 ? null : textStream(lines[headerAt]!);
  return textStream(
    lines
      .filter((l, i) => {
        const trimmed = l.trim();
        if (isCitationFooter(trimmed) || ORPHAN_FRAGMENT.test(trimmed)) return false;
        return header === null || i === headerAt || textStream(l) !== header;
      })
      .join(""),
  );
}

/**
 * Asserts that `parts` all appear, in this order, within one row of the source.
 *
 * `window` is how many consecutive raw lines may be joined to form that row —
 * 1 for tables the PDF prints one row per line, more where a cell wraps. It
 * stays as small as each table allows, because the window is exactly the
 * slack an error can hide in: rows sit further apart than their own window, so
 * text borrowed from a neighbouring row still fails.
 *
 * Order matters as much as co-location: it is what distinguishes
 * "มูลวัว … 1.1-0.4-1.6 … ปลอดภัย" from the same three strings scattered down a
 * column.
 */
function expectInSourceRow(
  lines: readonly string[],
  parts: readonly string[],
  what: string,
  window = 1,
): void {
  const needles = parts.map(textStream).filter((p) => p !== "");
  const contains = (stream: string): boolean => {
    let at = 0;
    return needles.every((needle) => {
      const found = stream.indexOf(needle, at);
      if (found === -1) return false;
      at = found + needle.length;
      return true;
    });
  };
  const found = lines.some((_, i) => contains(textStream(lines.slice(i, i + window).join(""))));
  expect(
    found,
    `${what}: no ${window === 1 ? "source line" : `${window} adjacent source lines`} contain ${needles.join(" → ")}`,
  ).toBe(true);
}

describe("structural validation", () => {
  it("every table file matches its schema", () => {
    // The `as Table<…>` casts in index.ts check nothing; this does.
    expect(() => assertTables()).not.toThrow();
  });
});

describe("table inventory", () => {
  it("ships exactly the nine source tables", () => {
    expect(TABLE_IDS).toHaveLength(9);
    expect([...TABLE_IDS].sort()).toEqual(Object.keys(EXPECTED_ROWS).sort());
  });

  it("has no stray JSON file in content/data", () => {
    const onDisk = readdirSync(DATA_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""))
      .sort();
    expect(onDisk).toEqual([...TABLE_IDS].sort());
  });

  it.each(TABLE_IDS)("%s has the row count the source has", (id) => {
    expect(RAW_TABLES[id].rows).toHaveLength(EXPECTED_ROWS[id]);
    expect(RAW_TABLES[id].rowCount).toBe(EXPECTED_ROWS[id]);
  });

  it.each(TABLE_IDS)("%s tags every row with a country", (id) => {
    for (const row of RAW_TABLES[id].rows) {
      expect(["TH", "KH", "NEUTRAL"], `${id}/${row.id}`).toContain(row.country);
    }
  });
});

describe("oxide form", () => {
  // P₂O₅ is ~2.29× elemental P and K₂O ~1.20× elemental K, so a bare `p` or
  // `k` key is a silent 2.3× error waiting to be read as a rate.
  const FORBIDDEN = /^(p|k|phosphorus|potassium|elemental.*|.*Elemental)$/i;

  function keysOf(value: unknown, into = new Set<string>()): Set<string> {
    if (Array.isArray(value)) for (const item of value) keysOf(item, into);
    else if (value !== null && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) {
        into.add(key);
        keysOf(child, into);
      }
    }
    return into;
  }

  it.each(TABLE_IDS)("%s uses no elemental nutrient key", (id) => {
    for (const key of keysOf(RAW_TABLES[id])) {
      expect(FORBIDDEN.test(key), `${id} has an elemental key "${key}"`).toBe(false);
    }
  });

  it("kg/ha supply figures use their own field names, so they cannot be formatted as a grade", () => {
    const supplies = RAW_TABLES["rice-by-soil-group-kh"].rows.flatMap((r) =>
      r.suppliesNpkKgPerHa ? [r.suppliesNpkKgPerHa] : [],
    );
    expect(supplies).toHaveLength(8);
    for (const supply of supplies) {
      expect(Object.keys(supply).sort()).toEqual(["k2oKg", "nKg", "p2o5Kg"]);
    }
    // @ts-expect-error formatGrade takes a percentage grade, never kg/ha.
    const guarded = (): string => formatGrade(supplies[0]!);
    expect(guarded).toBeTypeOf("function");
  });
});

/* ------------------------------------------------ numbers, anchored to rows */

describe("nutrient groups are anchored to their source row", () => {
  const table = RAW_TABLES["nutrient-groups"];
  const lines = rawLines(table.sourcePages);
  const page = rawPage(table.sourcePages);

  it.each(table.rows)("$id: group, elements and role are one source row", (row) => {
    // p2 wraps this table's cells over up to four lines, so the window is 4.
    // The rows are further apart than that, so a role borrowed from another
    // row still fails.
    expectInSourceRow(
      lines,
      [row.labels.th.group, row.elements.join(","), row.labels.th.role],
      row.id,
      4,
    );
    expect(page).toContain(textStream(row.labels.th.group));
  });
});

describe("deficiency symptoms are anchored to their element", () => {
  const table = RAW_TABLES["deficiency-symptoms"];
  const lines = rawLines(table.sourcePages);

  it.each(table.rows)("$id: the symptom belongs to this element and no other", (row) => {
    // p3 prints one row per line: "N ใบแก่เหลืองซีดทั้งใบ ต้นแคระ". Requiring
    // element-then-symptom on one line is what makes swapping two rows' text
    // fail — whole-page containment cannot see the difference.
    expectInSourceRow(lines, [row.elements.join("/"), row.labels.th.symptom], row.id);
  });
});

describe("organic fertilizer NPK is anchored to its row", () => {
  const table = RAW_TABLES["organic-fertilizer-npk"];
  const lines = rawLines(table.sourcePages);

  it.each(table.rows)("$id: name, NPK and note are one source row", (row) => {
    // "มูลวัว ( ปุ๋ยคอก ) 1.1-0.4-1.6 ปลอดภัย ช่วยให้ดินร่วน …"
    expectInSourceRow(lines, [row.labels.th.name, formatGrade(row.npk), row.labels.th.note], row.id);
  });

  // formatGrade(npk) drops a trailing zero ("1.5-0.4-1"), which still passes the substring check
  // above; npkText is the printed form, so it must match the page token for token.
  it.each(table.rows)("$id: npkText is the printed token, trailing zeros included", (row) => {
    const tokens = lines.join(" ").split(/\s+/);
    expect(tokens, row.id).toContain(row.labels.th.npkText);
  });
});

describe("compound grades are anchored to their use", () => {
  const table = RAW_TABLES["compound-grades"];
  const lines = rawLines(table.sourcePages);

  it.each(table.rows)("$id: grades and use are one source row", (row) => {
    // "15-15-15 / 16-16-16 ผัก ไม้ผลช่วงบำรุงต้น …"
    expectInSourceRow(lines, [...row.grades.map(formatGrade), row.labels.th.useFor], row.id);
  });
});

describe("soil conditioners are anchored to their lime equivalence", () => {
  const table = RAW_TABLES["soil-conditioners"];
  const lines = rawLines(table.sourcePages);

  it.each(table.rows)("$id: name, purpose and factor are one source row", (row) => {
    expectInSourceRow(
      lines,
      [row.labels.th.name, row.labels.th.purpose, row.labels.th.equivalence],
      row.id,
    );
  });

  it.each(table.rows)("$id: the stored factor matches the printed one", (row) => {
    if (row.limeEquivalence === null) expect(row.labels.th.equivalence).toBe("–");
    else expect(row.labels.th.equivalence).toContain(String(row.limeEquivalence));
  });
});

describe("straight fertilizers are anchored to their grade", () => {
  const table = RAW_TABLES["straight-fertilizers"];
  const page = rawPage(table.sourcePages);

  // p4's cells wrap across several lines, so this table is pinned by the grade
  // string instead: the printed grade is verbatim from the page, and the
  // parsed grade must reproduce it exactly.
  it.each(table.rows)("$id: the parsed grade reproduces the printed one", (row) => {
    expect(page, `${row.id}: printed grade not on the page`).toContain(
      textStream(row.labels.th.grade),
    );
    if (row.grade) expect(row.labels.th.grade).toContain(formatGrade(row.grade));
    else expect(row.labels.th.grade).not.toMatch(/\d+-\d+-\d+/);
  });

  it("records sulphur only where the source prints it", () => {
    for (const row of table.rows) {
      if (row.sulphurPercent !== null) expect(row.labels.th.grade).toContain(String(row.sulphurPercent));
    }
    expect(table.rows.filter((r) => r.sulphurPercent !== null).map((r) => r.id)).toEqual([
      "ammonium-sulfate",
    ]);
  });
});

describe("Cambodian rice rates are anchored to their soil group", () => {
  const table = RAW_TABLES["rice-by-soil-group-kh"];
  const lines = rawLines(table.sourcePages);

  it.each(table.rows)("$id: soil, fertilizer and supply are one source row", (row) => {
    // "ប្រៃខ្មែរ Prey Khmer អ៊ុយរ៉េ 50 + DAP 25 + KCl 25 28-12-15"
    const { urea, dap, kcl } = row.perHectare;
    const printed = [
      String(urea),
      ...(dap ? [`+ DAP ${dap}`] : []),
      ...(kcl ? [`+ KCl ${kcl}`] : []),
    ];
    const supply = row.suppliesNpkKgPerHa;
    const tail = supply ? [`${supply.nKg}-${supply.p2o5Kg}-${supply.k2oKg}`] : [];
    expectInSourceRow(lines, [row.labels.en.soil, ...printed, ...tail], row.id);
  });

  it("puts the doubling qualifier on the rate, not on the soil name", () => {
    const unknown = table.rows.find((r) => r.id === "unknown");
    expect(unknown?.labels.en.soil).toBe("Unknown");
    expect(unknown?.rateNote).toBe("double if low drought/flood risk");
    for (const row of table.rows) expect(row.labels.en.soil, row.id).not.toMatch(/double|risk/i);
  });
});

describe("crop guidance is anchored to its own wording", () => {
  const table = RAW_TABLES["other-crops"];

  // NFKC because the PDF's Latin font emits "flowering" with an ﬂ ligature
  // (U+FB02); these `text` strings are English, so normalising them is safe.
  const page = rawPage(table.sourcePages).normalize("NFKC");

  // p12's cells wrap badly, so each Guidance keeps the source's wording in
  // `text`; that string is checked verbatim against the page, and every number
  // parsed out of it must be recoverable from it. Together those close the
  // 10×-rate hole and the invented-guidance hole: a rate that is not in its own
  // text fails, and an invented guidance item has no text on the page.
  const guidances = table.rows.flatMap((row) =>
    [...row.basal, ...row.topDressing].map((g, i) => ({ row, g, at: `${row.id}[${i}]` })),
  );

  it("has guidance to check", () => {
    expect(guidances.length).toBeGreaterThan(15);
  });

  it.each(guidances)("$at: the wording is verbatim from the source", ({ at, g }) => {
    // One cell is not contiguous in the extraction: the vegetable row's basal
    // cell runs "Manure or / compost + a little" at the foot of p12, and its
    // remainder "DAP / 15-15-15" appears at the top of p13 — with that row's
    // other two columns printed in between, because the extractor walks the
    // page column by column. The split is declared rather than worked around,
    // and the assertion below proves the declaration reproduces `text`
    // exactly, so it cannot be used to smuggle a change past this check.
    const fragments = SPLIT_ACROSS_PAGES[at] ?? [g.text];
    expect(fragments.join(" "), `${at}: declared fragments do not rebuild the text`).toBe(g.text);

    let at_ = 0;
    for (const fragment of fragments) {
      const found = page.indexOf(textStream(fragment).normalize("NFKC"), at_);
      expect(found, `${at}: "${fragment}" is not on p12–13 in order`).toBeGreaterThanOrEqual(0);
      at_ = found + textStream(fragment).length;
    }
  });

  it.each(guidances)("$at: every parsed grade appears in its own wording", ({ at, g }) => {
    for (const grade of g.grades) {
      const printed = formatGrade(grade);
      const named = NAMED_FERTILIZERS[printed];
      const ok = g.text.includes(printed) || (named?.some((n) => g.text.includes(n)) ?? false);
      expect(ok, `${at}: grade ${printed} is not in "${g.text}"`).toBe(true);
    }
  });

  it.each(guidances)("$at: every parsed rate appears in its own wording", ({ at, g }) => {
    if (g.rate === null) return;
    const numbers = "min" in g.rate ? [g.rate.min, g.rate.max] : [g.rate.value];
    for (const number of numbers) {
      expect(g.text, `${at}: ${number} is not in its own wording`).toContain(String(number));
    }
    // Checked part by part: the source writes one of these as
    // "190–330 kg fertilizer/ha", so the unit is present but not contiguous.
    for (const part of g.unit!.split("/")) {
      expect(g.text, `${at}: unit part "${part}" is not in its own wording`).toContain(part);
    }
  });

  it("resolves named fertilizers to grades consistently across the table", () => {
    // Either a cell's named fertilizers are resolved to grades or they are
    // not; the review found urea and DAP resolved on one row and dropped on
    // another. This pins the rule: if the wording names one, it is resolved.
    for (const { at, g } of guidances) {
      for (const [printed, names] of Object.entries(NAMED_FERTILIZERS)) {
        if (!names.some((n) => g.text.includes(n))) continue;
        expect(
          g.grades.map(formatGrade),
          `${at}: wording names ${names[0]} but ${printed} is missing`,
        ).toContain(printed);
      }
    }
  });
});

/* --------------------------------------------------------------- tagging */

describe("country tagging and the Cambodian exclusion", () => {
  it("tags every row of the p11 rice table KH", () => {
    for (const row of RAW_TABLES["rice-by-soil-group-kh"].rows) expect(row.country).toBe("KH");
  });

  it("makes no KH row reachable from any v1 (Thai) query", () => {
    expect(riceSoilGroups("th")).toEqual([]);
    for (const row of organicFertilizers("th")) expect(row.country).not.toBe("KH");
    for (const crop of cropsFor("th")) expect(crop.row.country).not.toBe("KH");
  });

  it("lets no KH-scoped guidance survive into a Thai crop match", () => {
    for (const { row, basal, topDressing } of cropsFor("th")) {
      for (const guidance of [...basal, ...topDressing]) {
        expect(guidance.scope, `${row.id} leaked ${guidance.scope} guidance`).not.toBe("KH");
      }
    }
  });

  it("exposes no unfiltered guidance alongside the filtered arrays", () => {
    // The leak the review found: `crop.row.topDressing` used to be the raw,
    // unfiltered array, one property access from the filtered one.
    for (const crop of cropsFor("th")) {
      expect(crop.row).not.toHaveProperty("basal");
      expect(crop.row).not.toHaveProperty("topDressing");
    }
  });

  it("still holds the Cambodian guidance it is hiding, rather than dropping it", () => {
    const mixed = RAW_TABLES["other-crops"].rows.filter((r) =>
      [...r.basal, ...r.topDressing].some((g) => g.scope === "KH"),
    );
    expect(mixed.map((r) => r.id)).toEqual(["cassava", "vegetables"]);
    expect(riceSoilGroups("km")).toHaveLength(9);
  });

  it("keeps regional guidance, which is not country-specific", () => {
    const cassava = cropsFor("th").find((c) => c.row.id === "cassava");
    expect(cassava?.topDressing.some((g) => g.scope === "REGIONAL")).toBe(true);
  });

  it("refuses a locale with no audience rather than guessing one", () => {
    expect(() => audienceFor("en")).toThrow(/no audience country/);
  });
});

describe("provenance is never asserted beyond the source", () => {
  it("marks the vegetable row's advice UNSTATED, not Thai", () => {
    // p13 gives this row one citation — CDRI Working Paper 91, a Cambodian
    // survey — and prints no (TH) marker. Tagging its advice TH would claim a
    // Thai provenance the source never gives.
    const vegetables = RAW_TABLES["other-crops"].rows.find((r) => r.id === "vegetables")!;
    const scopes = [...vegetables.basal, ...vegetables.topDressing].map((g) => g.scope);
    expect(scopes).not.toContain("TH");
    expect(scopes).toContain("UNSTATED");
    expect(vegetables.sourceNote).toContain("CDRI");
  });

  it("uses TH scope only where the source attributes a Thai origin", () => {
    const THAI_MARKERS = ["TH", "TAS", "Rice Dept.", "DOA", "RAOT", "Nakhon Sawan", "YRU", "Thai"];
    for (const row of RAW_TABLES["other-crops"].rows) {
      for (const g of [...row.basal, ...row.topDressing]) {
        if (g.scope !== "TH") continue;
        const attributed =
          g.text.startsWith("TH:") || THAI_MARKERS.some((m) => row.sourceNote.includes(m));
        expect(
          attributed,
          `${row.id}: TH scope with no Thai attribution in "${row.sourceNote}"`,
        ).toBe(true);
      }
    }
  });

  it("records how many sources an overflow pill stands for", () => {
    // p12 prints `cgiar +3` on the cassava row; the three extra sources are
    // named nowhere in the document, so only the count can be kept.
    const cassava = RAW_TABLES["other-crops"].rows.find((r) => r.id === "cassava");
    expect(cassava?.citations).toEqual(["cgiar"]);
    expect(cassava?.citationsMore).toBe(3);
  });
});

describe("nothing is invented where the source is silent", () => {
  it("gives rock phosphate no grade", () => {
    expect(
      RAW_TABLES["straight-fertilizers"].rows.find((r) => r.id === "rock-phosphate")?.grade,
    ).toBeNull();
  });

  it("gives gypsum no lime equivalence", () => {
    expect(
      RAW_TABLES["soil-conditioners"].rows.find((r) => r.id === "gypsum")?.limeEquivalence,
    ).toBeNull();
  });

  it("gives the unknown-soil rice row no stated NPK", () => {
    expect(
      RAW_TABLES["rice-by-soil-group-kh"].rows.find((r) => r.id === "unknown")?.suppliesNpkKgPerHa,
    ).toBeNull();
  });

  it("gives Zn and Cu/Mo no mobility, because the source never classifies them", () => {
    const unclassified = deficiencyRows().filter((r) => r.mobility === null);
    expect(unclassified.map((r) => r.id)).toEqual(["zn", "cu-mo"]);
    for (const row of unclassified) expect(showsFirstOn(row)).toBeNull();
  });

  it("classifies exactly the elements the source's rule names", () => {
    const mobile = deficiencyRows()
      .filter((r) => r.mobility === "mobile")
      .flatMap((r) => r.elements);
    const immobile = deficiencyRows()
      .filter((r) => r.mobility === "immobile")
      .flatMap((r) => r.elements);
    expect(mobile.sort()).toEqual(["K", "Mg", "N", "P"]);
    expect(immobile.sort()).toEqual(["B", "Ca", "Fe", "Mn", "S"]);
    for (const row of deficiencyRows()) {
      if (row.mobility === "mobile") expect(showsFirstOn(row)).toBe("old-leaves");
      if (row.mobility === "immobile") expect(showsFirstOn(row)).toBe("young-leaves");
    }
  });

  it("gives the vegetable row no rate a Thai grower could act on", () => {
    // Surfacing this gap is the point: it is what T-008 proposes a fix for.
    const vegetables = cropsFor("th").find((c) => c.row.id === "vegetables")!;
    for (const guidance of [...vegetables.basal, ...vegetables.topDressing]) {
      expect(guidance.rate).toBeNull();
    }
  });
});

describe("glossary rows keep their columns together", () => {
  const lines = rawLines(RAW_TABLES.glossary.sourcePages).map((l) => l.normalize("NFKC"));

  it.each(glossaryRows())("$id: Thai, English and Chinese are one source row", (row) => {
    // NFKC because the PDF's CJK font emits some glyphs as Kangxi radicals
    // (⽣ for 生). Applied to this comparison only: NFKC can reorder Thai
    // combining marks, so the Thai checks elsewhere deliberately avoid it.
    expectInSourceRow(
      lines,
      [row.labels.th, row.labels.en, row.labels.zh].map((s) => s.normalize("NFKC")),
      row.id,
    );
  });
});

describe("formatting", () => {
  it("renders a grade the way a bag prints it", () => {
    expect(formatGrade({ n: 16, p2o5: 20, k2o: 0 })).toBe("16-20-0");
    expect(formatGrade({ n: 46, p2o5: 0, k2o: 0 })).toBe("46-0-0");
  });

  it("renders ranges with the source's en dash", () => {
    expect(formatQuantity({ min: 20, max: 25 })).toBe("20–25");
    expect(formatQuantity({ value: 100 })).toBe("100");
  });
});
