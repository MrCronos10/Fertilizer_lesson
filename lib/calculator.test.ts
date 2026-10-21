import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  M2_PER_RAI,
  RAI_PER_HECTARE,
  hectareToRai,
  kgPerHaToKgPerRai,
  kgPerRaiToKgPerHa,
  nutrientsInBag,
  productFor,
  raiToHectare,
} from "./calculator";
import { calculatorRates } from "./calculator-data";
import { cropsFor, cropsForReading } from "./data";
import type { Npk } from "./data";

const UREA: Npk = { n: 46, p2o5: 0, k2o: 0 };
const G16_20_0: Npk = { n: 16, p2o5: 20, k2o: 0 };

function ok<T extends { ok: boolean }>(result: T): Extract<T, { ok: true }> {
  if (!result.ok) throw new Error(`expected ok, got ${JSON.stringify(result)}`);
  return result as Extract<T, { ok: true }>;
}

describe("the source's worked example: N 10 kg/rai from urea 46-0-0", () => {
  const result = ok(productFor({ nutrient: "n", targetKgPerRai: 10, grade: UREA }));

  it("is 10 × 100 ÷ 46 ≈ 22 kg", () => {
    expect(result.productKg).toBeCloseTo(21.7391304, 6);
    expect(result.roundedKg).toBe(22);
  });

  it("shows its working in the source's own form, with the intermediate steps", () => {
    expect(result.steps).toEqual([
      { op: "multiply", a: 10, b: 100, result: 1000 },
      { op: "divide", a: 1000, b: 46, result: 1000 / 46 },
      { op: "round", value: 1000 / 46, result: 22 },
    ]);
  });
});

describe("the source's bag example: 50 kg of 16-20-0", () => {
  it("contains 8 kg N and 10 kg P₂O₅ and no K₂O", () => {
    const bag = ok(nutrientsInBag({ bagKg: 50, grade: G16_20_0 }));
    expect(bag.nKg).toBe(8);
    expect(bag.p2o5Kg).toBe(10);
    expect(bag.k2oKg).toBe(0);
  });
});

describe("the formula, for every nutrient", () => {
  it.each([
    ["n", 8, { n: 16, p2o5: 20, k2o: 0 }, 50],
    ["p2o5", 10, { n: 16, p2o5: 20, k2o: 0 }, 50],
    ["k2o", 4, { n: 16, p2o5: 16, k2o: 8 }, 50],
    ["n", 2.3, UREA, 5],
  ] as const)("%s %d kg from %j needs %d kg of product", (nutrient, target, grade, expected) => {
    const r = ok(productFor({ nutrient, targetKgPerRai: target, grade }));
    expect(r.productKg).toBeCloseTo(expected, 9);
  });

  it("reads the percentage of the requested nutrient, not another one", () => {
    const grade = { n: 16, p2o5: 20, k2o: 0 };
    expect(ok(productFor({ nutrient: "n", targetKgPerRai: 8, grade })).productKg).toBeCloseTo(50, 9);
    expect(ok(productFor({ nutrient: "p2o5", targetKgPerRai: 8, grade })).productKg).toBeCloseTo(40, 9);
  });

  it("rounds to a whole kg like the source, but never turns a small positive amount into 0", () => {
    expect(ok(productFor({ nutrient: "n", targetKgPerRai: 0.1, grade: UREA })).roundedKg).toBe(0.2);
    expect(ok(productFor({ nutrient: "n", targetKgPerRai: 0.1, grade: UREA })).roundedKg).toBeGreaterThan(0);
    expect(ok(productFor({ nutrient: "n", targetKgPerRai: 10, grade: UREA })).roundedKg).toBe(22);
  });

  it("accepts a zero target and answers 0 kg", () => {
    const r = ok(productFor({ nutrient: "n", targetKgPerRai: 0, grade: UREA }));
    expect(r.productKg).toBe(0);
    expect(r.roundedKg).toBe(0);
  });
});

describe("rejects what it cannot answer instead of returning a number", () => {
  const base = { nutrient: "p2o5", targetKgPerRai: 5, grade: UREA } as const;

  it("a 0% nutrient is refused, not divided by", () => {
    expect(productFor(base)).toEqual({ ok: false, error: "nutrient-zero" });
    expect(productFor({ nutrient: "k2o", targetKgPerRai: 5, grade: G16_20_0 })).toEqual({
      ok: false,
      error: "nutrient-zero",
    });
  });

  it("a negative target is refused", () => {
    expect(productFor({ ...base, nutrient: "n", targetKgPerRai: -1 })).toEqual({ ok: false, error: "target-invalid" });
    expect(productFor({ ...base, nutrient: "n", targetKgPerRai: -0.0001 })).toEqual({ ok: false, error: "target-invalid" });
  });

  it.each([NaN, Infinity, -Infinity])("a target of %s is refused", (target) => {
    expect(productFor({ ...base, nutrient: "n", targetKgPerRai: target })).toEqual({ ok: false, error: "target-invalid" });
  });

  it.each([
    ["a percentage above 100", { n: 101, p2o5: 0, k2o: 0 }],
    ["a negative percentage", { n: -5, p2o5: 5, k2o: 0 }],
    ["a grade summing above 100%", { n: 60, p2o5: 30, k2o: 20 }],
    ["a NaN percentage", { n: NaN, p2o5: 0, k2o: 0 }],
  ])("%s is refused", (_label, grade) => {
    expect(productFor({ nutrient: "n", targetKgPerRai: 5, grade })).toEqual({ ok: false, error: "grade-invalid" });
  });

  it("a result that overflows is refused, not returned as Infinity", () => {
    expect(productFor({ nutrient: "n", targetKgPerRai: 1e308, grade: UREA })).toEqual({
      ok: false,
      error: "result-invalid",
    });
  });

  it("a bag weight must be a non-negative finite number", () => {
    expect(nutrientsInBag({ bagKg: -1, grade: G16_20_0 })).toEqual({ ok: false, error: "bag-invalid" });
    expect(nutrientsInBag({ bagKg: NaN, grade: G16_20_0 })).toEqual({ ok: false, error: "bag-invalid" });
    expect(nutrientsInBag({ bagKg: 50, grade: { n: 50, p2o5: 50, k2o: 50 } })).toEqual({ ok: false, error: "grade-invalid" });
  });
});

describe("hostile input from a form", () => {
  it("never returns -0, which a UI would print as '-0 kg'", () => {
    const r = ok(productFor({ nutrient: "n", targetKgPerRai: -0, grade: UREA }));
    for (const v of [r.productKg, r.roundedKg, r.targetKgPerRai, ...r.steps.flatMap((st) => Object.values(st).filter((x): x is number => typeof x === "number"))]) {
      expect(Object.is(v, -0), `${v} is -0`).toBe(false);
    }
    const bag = ok(nutrientsInBag({ bagKg: -0, grade: G16_20_0 }));
    for (const v of [bag.nKg, bag.p2o5Kg, bag.k2oKg]) expect(Object.is(v, -0)).toBe(false);
    const negGrade = ok(nutrientsInBag({ bagKg: 50, grade: { n: -0, p2o5: 20, k2o: 0 } }));
    expect(Object.is(negGrade.nKg, -0)).toBe(false);
    expect(Object.is(hectareToRai(-0), -0)).toBe(false);
    expect(Object.is(raiToHectare(-0), -0)).toBe(false);
    expect(Object.is(kgPerRaiToKgPerHa(-0), -0)).toBe(false);
    expect(Object.is(kgPerHaToKgPerRai(-0), -0)).toBe(false);
  });

  it("a missing grade is an answer, not a crash", () => {
    // @ts-expect-error — what an unparsed form hands over.
    expect(productFor({ nutrient: "n", targetKgPerRai: 5, grade: null })).toEqual({ ok: false, error: "grade-invalid" });
    // @ts-expect-error — and undefined.
    expect(nutrientsInBag({ bagKg: 5, grade: undefined })).toEqual({ ok: false, error: "grade-invalid" });
  });

  it("a bag so heavy its nutrients overflow is refused, not returned as Infinity", () => {
    expect(nutrientsInBag({ bagKg: 1e308, grade: { n: 100, p2o5: 0, k2o: 0 } })).toEqual({ ok: false, error: "result-invalid" });
  });

  it("names the right error for an unknown nutrient (not whatever NaN happens to produce)", () => {
    // @ts-expect-error — elemental phosphorus.
    expect(productFor({ nutrient: "p", targetKgPerRai: 1, grade: UREA })).toEqual({ ok: false, error: "nutrient-unknown" });
    for (const key of ["__proto__", "toString", "constructor"]) {
      // @ts-expect-error — a prototype key must not read through to Object.prototype.
      expect(productFor({ nutrient: key, targetKgPerRai: 1, grade: UREA })).toEqual({ ok: false, error: "nutrient-unknown" });
    }
  });

  it("reports the first problem in a fixed order: nutrient, then target, then grade, then a 0% nutrient", () => {
    const badGrade = { n: 90, p2o5: 90, k2o: 0 };
    // @ts-expect-error — unknown nutrient beats everything.
    expect(productFor({ nutrient: "x", targetKgPerRai: -1, grade: badGrade }).error).toBe("nutrient-unknown");
    expect(productFor({ nutrient: "n", targetKgPerRai: -1, grade: badGrade })).toEqual({ ok: false, error: "target-invalid" });
    expect(productFor({ nutrient: "n", targetKgPerRai: 1, grade: badGrade })).toEqual({ ok: false, error: "grade-invalid" });
    expect(productFor({ nutrient: "k2o", targetKgPerRai: 1, grade: UREA })).toEqual({ ok: false, error: "nutrient-zero" });
  });
});

describe("the formula holds on a whole grid, so no factor can hide anywhere in the path", () => {
  it("kg product = target × 100 ÷ percent, exactly, for every nutrient", () => {
    let checked = 0;
    for (const n of [0, 5, 16, 46]) {
      for (const p of [0, 8, 20, 46]) {
        for (const k of [0, 6, 15]) {
          if (n + p + k > 100) continue; // not a grade a bag can have
          const grade = { n, p2o5: p, k2o: k };
          for (const nutrient of ["n", "p2o5", "k2o"] as const) {
            const pct = grade[nutrient];
            if (pct === 0) continue;
            for (const target of [0.5, 1, 2.3, 10, 37.25]) {
              const r = ok(productFor({ nutrient, targetKgPerRai: target, grade }));
              expect(r.productKg).toBe((target * 100) / pct);
              checked++;
            }
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(200);
  });

  it("a bag holds weight × percent ÷ 100, exactly, for every nutrient", () => {
    for (const bag of [1, 25, 50]) {
      const r = ok(nutrientsInBag({ bagKg: bag, grade: { n: 16, p2o5: 20, k2o: 8 } }));
      expect([r.nKg, r.p2o5Kg, r.k2oKg]).toEqual([(bag * 16) / 100, (bag * 20) / 100, (bag * 8) / 100]);
    }
  });
});

describe("rai and hectare, using the source's constants", () => {
  it("1 ไร่ = 1,600 m² and 1 ha = 6.25 ไร่", () => {
    expect(M2_PER_RAI).toBe(1600);
    expect(RAI_PER_HECTARE).toBe(6.25);
  });

  it("the two constants agree with each other: 10,000 m² ÷ 1,600 m² = 6.25", () => {
    expect(10_000 / M2_PER_RAI).toBe(RAI_PER_HECTARE);
  });

  it("converts both ways", () => {
    expect(hectareToRai(1)).toBe(6.25);
    expect(raiToHectare(6.25)).toBe(1);
    expect(raiToHectare(hectareToRai(3.7)!)).toBeCloseTo(3.7, 12);
  });

  it("a rate per hectare is 6.25 times a rate per rai", () => {
    expect(kgPerRaiToKgPerHa(80)).toBe(500);
    expect(kgPerHaToKgPerRai(500)).toBe(80);
  });

  it("refuses a negative or non-finite area or rate", () => {
    for (const bad of [-1, NaN, Infinity]) {
      expect(hectareToRai(bad)).toBeNull();
      expect(raiToHectare(bad)).toBeNull();
      expect(kgPerHaToKgPerRai(bad)).toBeNull();
      expect(kgPerRaiToKgPerHa(bad)).toBeNull();
    }
  });
});

describe("no elemental ↔ oxide conversion exists (D10)", () => {
  const files = ["calculator.ts", "calculator-data.ts"].map((f) => readFileSync(join(process.cwd(), "lib", f), "utf8"));
  // Comments are prose that may *name* the forbidden thing; only code counts.
  const code = files.map((f) => f.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")).join("\n");

  // Every well-known P→P₂O₅ and K→K₂O factor, in either direction, with number boundaries
  // so that `0.83;` and `(2.29)` are caught and `12.29` or `0.8` are not.
  it.each([
    "2.29", "2.2914", "2.291", "2.3", "1.2046", "1.205", "1.2", "1.21", "0.4364", "0.436", "0.44", "0.8301", "0.83", "0.8",
    "141.94", "142", "94.2", "30.97", "39.1", "62",
  ])("contains no conversion factor %s", (factor) => {
    const token = new RegExp(`(?<![\\d.])${factor.replace(/\./g, "\\.")}(?![\\d])`);
    expect(code).not.toMatch(token);
  });

  it("offers only the three oxide-form nutrients", () => {
    const grade: Npk = { n: 10, p2o5: 10, k2o: 10 };
    // @ts-expect-error — elemental phosphorus is not a nutrient this module knows.
    expect(productFor({ nutrient: "p", targetKgPerRai: 1, grade }).ok).toBe(false);
    // @ts-expect-error — nor elemental potassium.
    expect(productFor({ nutrient: "k", targetKgPerRai: 1, grade }).ok).toBe(false);
  });

  it("names no elemental key", () => {
    expect(code).not.toMatch(/\b(?:p|k)\s*:\s*number/);
    expect(code).not.toMatch(/\.(?:p|k)\b(?!\w)/);
  });
});

/**
 * One test per crop row of the source's p12–13 table (D10, T-013). The source
 * gives a product rate per crop, not a nutrient target, so each case's nutrient
 * supply is worked out here by hand and written as a literal: the calculator must
 * agree with the arithmetic done independently of it, and give the published
 * rate back when asked for that supply.
 */
describe("agrees with the published rate for every crop row", () => {
  const published = calculatorRates("th");
  const byKey = (crop: string, stage: string) =>
    published.filter((p) => p.cropId === crop && p.stage === stage);

  // [crop, stage, grade as printed, product kg/rai (min, max), hand-computed supply per rai: [N, P₂O₅, K₂O] at min and max]
  const HAND: readonly [string, string, string, [number, number], [number[], number[]]][] = [
    ["rice-clay", "basal", "16-20-0", [20, 25], [[3.2, 4, 0], [4, 5, 0]]],
    ["rice-clay", "basal", "18-22-0", [20, 25], [[3.6, 4.4, 0], [4.5, 5.5, 0]]],
    ["rice-clay", "basal", "20-20-0", [20, 25], [[4, 4, 0], [5, 5, 0]]],
    ["rice-clay", "topDressing", "46-0-0", [5, 10], [[2.3, 0, 0], [4.6, 0, 0]]],
    ["rice-sandy", "basal", "16-16-8", [20, 25], [[3.2, 3.2, 1.6], [4, 4, 2]]],
    ["rice-sandy", "basal", "18-12-6", [20, 25], [[3.6, 2.4, 1.2], [4.5, 3, 1.5]]],
    ["rice-sandy", "basal", "16-8-8", [20, 25], [[3.2, 1.6, 1.6], [4, 2, 2]]],
    ["rice-sandy", "topDressing", "46-0-0", [5, 10], [[2.3, 0, 0], [4.6, 0, 0]]],
    // CIAT regional guidance, 500–600 kg/ha of 15-15-15 = 80–96 kg/rai.
    ["cassava", "topDressing", "15-15-15", [80, 96], [[12, 12, 12], [14.4, 14.4, 14.4]]],
  ];

  it.each(HAND)("%s %s %s", (cropId, stage, gradeText, [minKg, maxKg], [atMin, atMax]) => {
    const entry = byKey(cropId, stage).find((p) => `${p.grade.n}-${p.grade.p2o5}-${p.grade.k2o}` === gradeText);
    expect(entry, `${cropId} ${stage} ${gradeText} is published and actionable`).toBeDefined();
    expect(entry!.productKgPerRai.min).toBeCloseTo(minKg, 9);
    expect(entry!.productKgPerRai.max).toBeCloseTo(maxKg, 9);

    const supply = (kg: number) => ok(nutrientsInBag({ bagKg: kg, grade: entry!.grade }));
    for (const [kg, expected] of [[minKg, atMin], [maxKg, atMax]] as const) {
      const s = supply(kg);
      expect(s.nKg).toBeCloseTo(expected[0]!, 9);
      expect(s.p2o5Kg).toBeCloseTo(expected[1]!, 9);
      expect(s.k2oKg).toBeCloseTo(expected[2]!, 9);
      // ...and asking for that supply gives the published product rate back.
      for (const [nutrient, amount] of [["n", s.nKg], ["p2o5", s.p2o5Kg], ["k2o", s.k2oKg]] as const) {
        if (amount === 0) continue;
        expect(ok(productFor({ nutrient, targetKgPerRai: amount, grade: entry!.grade })).productKg).toBeCloseTo(kg, 9);
      }
    }
  });

  it("covers every published, actionable per-area rate and nothing else", () => {
    const covered = new Set(HAND.map(([c, s, g]) => `${c}|${s}|${g}`));
    const all = published.map((p) => `${p.cropId}|${p.stage}|${p.grade.n}-${p.grade.p2o5}-${p.grade.k2o}`);
    expect(all.sort()).toEqual([...covered].sort());
  });

  it("maize has grades but no published rate, so there is nothing to agree with", () => {
    const maize = cropsFor("th").find((c) => c.row.id === "maize")!;
    expect(maize.basal.some((g) => g.grades.length > 0 && g.rate === null)).toBe(true);
    expect(published.some((p) => p.cropId === "maize")).toBe(false);
  });

  it("durian is per tree, which is not an area rate, so it never reaches the calculator", () => {
    expect(cropsFor("th").some((c) => c.row.id === "durian")).toBe(true);
    expect(published.some((p) => p.cropId === "durian")).toBe(false);
  });
});

describe("no non-actionable Rate is reachable from the calculator's data queries (carried from T-007)", () => {
  const published = calculatorRates("th");

  it.each(["sugarcane", "mango", "rubber-immature", "rubber-tapped", "vegetables"])(
    "%s is absent",
    (id) => {
      expect(published.some((p) => p.cropId === id)).toBe(false);
    },
  );

  it("cassava's Thai 15-15-15 rate (25–50 kg/rai, commercial-only backing) is absent; only CIAT's regional line is present", () => {
    const cassava = published.filter((p) => p.cropId === "cassava");
    expect(cassava).toHaveLength(1);
    expect(cassava[0]!.scope).toBe("REGIONAL");
    expect(cassava.some((p) => p.productKgPerRai.min === 25)).toBe(false);
  });

  it("every entry traces back to guidance that is actionable", () => {
    // Keyed by crop and stage too: identical wording on a non-actionable row must not vouch for it.
    const actionable = new Set(
      cropsFor("th").flatMap((c) =>
        (["basal", "topDressing"] as const).flatMap((stage) =>
          c[stage].filter((g) => g.actionable).map((g) => `${c.row.id}|${stage}|${g.text}`),
        ),
      ),
    );
    for (const p of published) expect(actionable.has(`${p.cropId}|${p.stage}|${p.guidanceText}`), p.cropId).toBe(true);
  });

  it("no Cambodian-scoped guidance is reachable", () => {
    expect(published.every((p) => p.scope !== "KH")).toBe(true);
    expect(cropsForReading("th").some((c) => [...c.basal, ...c.topDressing].some((g) => g.scope === "KH"))).toBe(false);
  });
});
