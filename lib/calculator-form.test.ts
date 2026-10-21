import { describe, expect, it } from "vitest";
import { formatNumber, parseDecimal, runForm, summaryLine, workingLines, type FormState } from "./calculator-form";
import { publishedGrades } from "./calculator-data";

const UREA_FORM: FormState = { nutrient: "n", target: "10", n: "46", p2o5: "0", k2o: "0" };

describe("parseDecimal", () => {
  it.each([
    ["10", 10],
    [" 10.5 ", 10.5],
    [".5", 0.5],
    ["5.", 5],
    ["0", 0],
    ["-3", -3],
    ["๑๐", 10], // Thai digits, from a Thai keyboard
    ["๒.๕", 2.5],
  ])("%j → %d", (text, value) => {
    expect(parseDecimal(text)).toEqual({ ok: true, value });
  });

  it.each(["", "   ", "\t"])("%j is empty, not zero", (text) => {
    expect(parseDecimal(text)).toEqual({ ok: false, reason: "empty" });
  });

  it.each(["abc", "1e3", "0x10", "1,5", "10 kg", "--1", "+1", "1.2.3", "∞", "Infinity", "NaN", "١٠", "1 0", "."])(
    "%j is invalid, not silently read as a number",
    (text) => {
      expect(parseDecimal(text)).toEqual({ ok: false, reason: "invalid" });
    },
  );
});

describe("runForm: the source's worked example", () => {
  it("N 10 kg/rai from urea 46-0-0 → 10 × 100 ÷ 46 ≈ 22 kg", () => {
    const r = runForm(UREA_FORM);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.result.roundedKg).toBe(22);
      expect(r.result.steps.map((s) => s.op)).toEqual(["multiply", "divide", "round"]);
    }
  });

  it("accepts Thai digits throughout", () => {
    const r = runForm({ nutrient: "n", target: "๑๐", n: "๔๖", p2o5: "๐", k2o: "๐" });
    expect(r.ok && r.result.roundedKg).toBe(22);
  });
});

describe("runForm: every bad input gets a code and the field to flag", () => {
  const bad = (state: Partial<FormState>) => runForm({ ...UREA_FORM, ...state });

  it("an empty target is its own case, not 0 kg", () => {
    expect(bad({ target: "" })).toEqual({ ok: false, error: "target-empty", field: "target" });
    expect(bad({ target: "  " })).toEqual({ ok: false, error: "target-empty", field: "target" });
  });

  it("text in the target is not a number", () => {
    expect(bad({ target: "ten" })).toEqual({ ok: false, error: "not-a-number", field: "target" });
  });

  it("a negative target is invalid", () => {
    expect(bad({ target: "-1" })).toEqual({ ok: false, error: "target-invalid", field: "target" });
  });

  it("a blank grade field is empty, never silently 0%", () => {
    expect(bad({ n: "" })).toEqual({ ok: false, error: "grade-empty", field: "n" });
    expect(bad({ k2o: " " })).toEqual({ ok: false, error: "grade-empty", field: "k2o" });
    expect(bad({ p2o5: "", k2o: "" })).toEqual({ ok: false, error: "grade-empty", field: "p2o5" });
  });

  it("text in a grade field points at that field", () => {
    expect(bad({ p2o5: "x" })).toEqual({ ok: false, error: "not-a-number", field: "p2o5" });
  });

  it("a grade above 100% in total points at the grade as a whole", () => {
    expect(bad({ n: "60", p2o5: "30", k2o: "20" })).toEqual({ ok: false, error: "grade-invalid", field: "grade" });
  });

  it("a 0% nutrient points at the chosen nutrient's own field", () => {
    expect(bad({ nutrient: "p2o5" })).toEqual({ ok: false, error: "nutrient-zero", field: "p2o5" });
    expect(bad({ nutrient: "k2o" })).toEqual({ ok: false, error: "nutrient-zero", field: "k2o" });
  });

  it("an overflowing target is refused, not shown as Infinity", () => {
    expect(bad({ target: "1" + "0".repeat(307), n: "46" }).ok).toBe(false);
  });

  it("reports the target before the grade when both are wrong", () => {
    expect(bad({ target: "x", n: "x" })).toMatchObject({ error: "not-a-number", field: "target" });
  });
});

describe("formatNumber", () => {
  it.each([
    [1000, "1,000"],
    [22, "22"],
    [21.739130434, "21.74"],
    [0.2173913, "0.22"],
    [0.0043478, "0.0043"],
    [0, "0"],
    [1234567.891, "1,234,567.89"],
    [2.5, "2.5"],
  ])("%d → %s", (value, text) => {
    expect(formatNumber(value)).toBe(text);
  });

  it("never prints -0", () => {
    expect(formatNumber(-0)).toBe("0");
  });
});

describe("the published grades the picker offers", () => {
  const grades = publishedGrades();
  const text = (g: (typeof grades)[number]) => `${g.grade.n}-${g.grade.p2o5}-${g.grade.k2o}`;

  it("are exactly the bag grades printed in the source's p4 and p5 tables, in table order", () => {
    expect(grades.map(text)).toEqual([
      // p4, straight fertilizers
      "46-0-0", "21-0-0", "18-46-0", "0-46-0", "0-0-60", "0-0-50",
      // p5, compound grades
      "15-15-15", "16-16-16", "16-20-0", "18-22-0", "20-20-0", "16-16-8", "18-12-6", "16-8-8",
      "15-7-18", "13-13-21", "20-8-20", "20-10-12", "8-24-24", "12-24-12",
    ]);
  });

  it("name a straight fertilizer by the source's Thai, without the glossary's Chinese gloss", () => {
    const named = Object.fromEntries(grades.filter((g) => g.name).map((g) => [text(g), g.name]));
    expect(named).toEqual({
      "46-0-0": "ยูเรีย",
      "21-0-0": "แอมโมเนียมซัลเฟต",
      "18-46-0": "DAP",
      "0-46-0": "TSP",
      "0-0-60": "KCl",
      "0-0-50": "K₂SO₄",
    });
  });

  it("leave out rock phosphate, which the source gives no grade for", () => {
    expect(grades.some((g) => g.name?.includes("หินฟอสเฟต"))).toBe(false);
  });

  it("are all valid bag grades and carry no repeats", () => {
    expect(new Set(grades.map(text)).size).toBe(grades.length);
    for (const g of grades) expect(g.grade.n + g.grade.p2o5 + g.grade.k2o).toBeLessThanOrEqual(100);
  });
});

describe("the pages a result cites", () => {
  it("are the pages the note and the formula actually come from", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const { CALCULATOR_SOURCE_PAGES } = await import("../components/CalculatorForm");
    const { readUiStrings } = await import("./ui");
    const { textStream } = await import("./content");
    const raw = (n: number) => readFileSync(join(process.cwd(), `docs/content/raw/p${String(n).padStart(2, "0")}.txt`), "utf8");
    expect([...CALCULATOR_SOURCE_PAGES]).toEqual([3, 6]);
    expect(textStream(raw(3))).toContain(textStream(readUiStrings("th").soilTestNote));
    expect(textStream(raw(6))).toContain(textStream("10 × 100 ÷ 46 ≈ 22"));
    expect(textStream(raw(6))).toContain(textStream("1 ไร่ = 1,600"));
  });
});

describe("the displayed working never contradicts itself or the inputs", () => {
  const show = (state: Partial<FormState>) => {
    const r = runForm({ ...UREA_FORM, ...state });
    if (!r.ok) throw new Error(`expected ok, got ${JSON.stringify(r)}`);
    return { lines: workingLines(r.result), line: summaryLine(r.result), rounded: formatNumber(r.result.roundedKg), r };
  };
  const nums = (text: string) => [...text.matchAll(/-?[\d,]*\.?\d+/g)].map((m) => Number(m[0].replaceAll(",", "")));

  it("reproduces the source's example exactly: 10 × 100 = 1,000; 1,000 ÷ 46 = 21.74; ≈ 22", () => {
    const { lines, line } = show({});
    expect(lines).toEqual(["10 × 100 = 1,000", "1,000 ÷ 46 = 21.74", "21.74 ≈ 22"]);
    expect(line).toBe("10 × 100 ÷ 46 ≈ 22");
  });

  it.each([
    ["22.499", "100", "22.499 × 100 = 2,249.9", "2,249.9 ÷ 100 = 22.499", "22.499 ≈ 22"],
    ["10.005", "46", "10.005 × 100 = 1,000.5", "1,000.5 ÷ 46 = 21.75", "21.75 ≈ 22"],
    ["10", "46.123", "10 × 100 = 1,000", "1,000 ÷ 46.123 = 21.68", "21.68 ≈ 22"],
    ["0.995", "100", "0.995 × 100 = 99.5", "99.5 ÷ 100 = 0.995", "0.995 ≈ 1"],
  ])("target %s at %s%% is shown as typed, and the last step agrees with the one before", (target, percent, a, b, c) => {
    const { lines } = show({ target, n: percent, p2o5: "0", k2o: "0" });
    expect(lines).toEqual([a, b, c]);
  });

  it("the one-line summary prints the inputs as typed too", () => {
    expect(show({ target: "10", n: "46.123", p2o5: "0", k2o: "0" }).line).toBe("10 × 100 ÷ 46.123 ≈ 22");
    expect(show({ target: "22.499", n: "100", p2o5: "0", k2o: "0" }).line).toBe("22.499 × 100 ÷ 100 ≈ 22");
    expect(show({ target: "2.3", n: "20", p2o5: "0", k2o: "0" }).line).toBe("2.3 × 100 ÷ 20 ≈ 12");
  });

  it("a grid of inputs: every printed line is true arithmetic, and the rounding follows from what is printed", () => {
    let checked = 0;
    for (const target of ["0.1", "0.995", "1", "2.3", "10", "10.005", "22.499", "22.5", "37.25", "100"]) {
      for (const percent of ["15", "16", "20", "46", "46.123", "60", "100"]) {
        const { lines, r } = show({ target, n: percent, p2o5: "0", k2o: "0" });
        const [multiply, divide, round] = lines.map(nums) as [number[], number[], number[]];
        // a × 100 = product, exactly as printed
        expect(multiply[0]! * multiply[1]!, `${target}/${percent} multiply`).toBeCloseTo(multiply[2]!, 6);
        // product ÷ percent = quotient, to the digits printed
        const printedDigits = (lines[1]!.split("= ")[1]!.split(".")[1] ?? "").length;
        expect(divide[0]! / divide[1]!, `${target}/${percent} divide`).toBeCloseTo(divide[2]!, printedDigits);
        // the printed quotient rounds to the final answer
        expect(round[1], `${target}/${percent} round`).toBe(r.result.roundedKg);
        expect(Math.round(divide[2]!) === round[1] || divide[2]! < 1, `${target}/${percent} agrees`).toBe(true);
        checked++;
      }
    }
    expect(checked).toBe(70);
  });
});

describe("not-a-number is its own error, so the message can say so", () => {
  const bad = (state: Partial<FormState>) => runForm({ ...UREA_FORM, ...state });

  it("text, 1e3, a comma and stray characters are not numbers", () => {
    for (const target of ["ten", "1e3", "1,5", "10 kg"]) {
      expect(bad({ target }), target).toEqual({ ok: false, error: "not-a-number", field: "target" });
    }
    expect(bad({ p2o5: "abc" })).toEqual({ ok: false, error: "not-a-number", field: "p2o5" });
  });

  it("a negative target is a number, just not a valid one", () => {
    expect(bad({ target: "-1" })).toEqual({ ok: false, error: "target-invalid", field: "target" });
  });

  it("a value too big to compute with is refused as too large, not as 'invalid'", () => {
    expect(bad({ target: "1" + "0".repeat(320) })).toEqual({ ok: false, error: "result-invalid", field: "target" });
    expect(bad({ n: "1" + "0".repeat(320) })).toEqual({ ok: false, error: "result-invalid", field: "n" });
  });
});
