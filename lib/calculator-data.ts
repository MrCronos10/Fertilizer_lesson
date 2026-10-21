import { compoundGradeRows, cropsFor, straightFertilizers, type Npk, type Scope } from "./data";
import { kgPerHaToKgPerRai } from "./calculator";

/**
 * The only door from the source's crop table into the calculator (D9).
 *
 * It reads `cropsFor`, which already drops guidance that is not actionable —
 * commercial-only backing, no country attribution, Cambodian — so a rate the
 * site would not stand behind cannot become a number here by forgetting to
 * check a flag. What this adds is the filter the calculator itself needs: a
 * rate it can use is a product rate **per area**. Per-tree rates (durian) and
 * rates with no number (maize) have nothing to compute against.
 */
export interface PublishedRate {
  readonly cropId: string;
  readonly stage: "basal" | "topDressing";
  readonly grade: Npk;
  /** Product per rai. A single published value has min = max. */
  readonly productKgPerRai: { readonly min: number; readonly max: number };
  readonly scope: Scope;
  /** The source's own wording of the guidance this came from, for traceability. */
  readonly guidanceText: string;
}

export function calculatorRates(locale: string): readonly PublishedRate[] {
  const rates: PublishedRate[] = [];
  for (const crop of cropsFor(locale)) {
    for (const stage of ["basal", "topDressing"] as const) {
      for (const guidance of crop[stage]) {
        if (!guidance.rate || guidance.grades.length === 0) continue;
        if (guidance.unit !== "kg/rai" && guidance.unit !== "kg/ha") continue;

        const range = "min" in guidance.rate ? guidance.rate : { min: guidance.rate.value, max: guidance.rate.value };
        const toRai = (kg: number) => (guidance.unit === "kg/ha" ? kgPerHaToKgPerRai(kg) : kg);
        const min = toRai(range.min);
        const max = toRai(range.max);
        if (min === null || max === null) continue;

        for (const grade of guidance.grades) {
          rates.push({
            cropId: crop.row.id,
            stage,
            grade,
            productKgPerRai: { min, max },
            scope: guidance.scope,
            guidanceText: guidance.text,
          });
        }
      }
    }
  }
  return rates;
}

/** A bag grade the source prints, for the calculator's picker. */
export interface PublishedGrade {
  readonly grade: Npk;
  /** The source's Thai name where the grade belongs to one straight fertilizer. */
  readonly name?: string;
}

/**
 * The grades the pamphlet prints on p4 (straight fertilizers) and p5 (compound
 * grades), in table order. Organic fertilizers' "about 1.5-0.4-1.0" figures are
 * not bag grades, and rock phosphate has none, so neither is here.
 *
 * The source's glossary names carry a Chinese gloss in brackets ("ยูเรีย (Urea,
 * 氮肥)"); only the part before the bracket is a name a picker should show.
 */
export function publishedGrades(): readonly PublishedGrade[] {
  const out: PublishedGrade[] = [];
  const seen = new Set<string>();
  const add = (grade: Npk, name?: string) => {
    const key = `${grade.n}-${grade.p2o5}-${grade.k2o}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(name ? { grade, name } : { grade });
  };
  for (const row of straightFertilizers()) {
    if (row.grade) add(row.grade, row.labels.th.name.split(" (")[0]);
  }
  for (const row of compoundGradeRows()) {
    for (const grade of row.grades) add(grade);
  }
  return out;
}
