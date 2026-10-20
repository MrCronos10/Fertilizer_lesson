import { RAW_TABLES, TABLE_IDS, type TableId } from "./index";

/**
 * Runtime schema checks for the nine table files.
 *
 * `lib/data/index.ts` asserts the JSON into its row types with `as`, which
 * checks nothing: a deleted required field, or an NPK triple replaced by the
 * string "28-12-15", compiles cleanly. This module is what actually enforces
 * the shapes, and the test suite runs it. Everything here is a structural
 * check — whether the numbers are *right* is a separate question, answered by
 * comparing them against the raw extraction in `data.test.ts`.
 */

type Problem = string;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function checkNumber(into: Problem[], where: string, value: unknown): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    into.push(`${where}: expected a finite number, got ${JSON.stringify(value)}`);
  }
}

function checkString(into: Problem[], where: string, value: unknown): void {
  if (typeof value !== "string" || value.trim() === "") {
    into.push(`${where}: expected a non-empty string, got ${JSON.stringify(value)}`);
  }
}

/** Percentage grade: exactly n/p2o5/k2o, each 0–100, summing to no more than 100. */
function checkNpk(into: Problem[], where: string, value: unknown): void {
  if (!isObject(value)) {
    into.push(`${where}: expected an NPK object, got ${JSON.stringify(value)}`);
    return;
  }
  const keys = Object.keys(value).sort();
  if (keys.join(",") !== "k2o,n,p2o5") {
    into.push(`${where}: NPK keys must be exactly n/p2o5/k2o, got ${keys.join(",")}`);
    return;
  }
  let sum = 0;
  for (const key of ["n", "p2o5", "k2o"] as const) {
    const component = value[key];
    checkNumber(into, `${where}.${key}`, component);
    if (typeof component === "number") {
      if (component < 0 || component > 100) into.push(`${where}.${key}: ${component} is not a percentage`);
      sum += component;
    }
  }
  // No real fertilizer grade reaches 100% of nutrients; the richest here is 64.
  // A kg/ha figure filed as a grade trips this even when each part looks sane.
  if (sum > 100) into.push(`${where}: components sum to ${sum}%, which no fertilizer can`);
}

/** kg/ha supply: different field names, no percentage ceiling. */
function checkNpkKgPerHa(into: Problem[], where: string, value: unknown): void {
  if (!isObject(value)) {
    into.push(`${where}: expected a kg/ha object, got ${JSON.stringify(value)}`);
    return;
  }
  const keys = Object.keys(value).sort();
  if (keys.join(",") !== "k2oKg,nKg,p2o5Kg") {
    into.push(`${where}: kg/ha keys must be exactly nKg/p2o5Kg/k2oKg, got ${keys.join(",")}`);
    return;
  }
  for (const key of ["nKg", "p2o5Kg", "k2oKg"] as const) {
    checkNumber(into, `${where}.${key}`, value[key]);
    const component = value[key];
    if (typeof component === "number" && component < 0) {
      into.push(`${where}.${key}: ${component} is negative`);
    }
  }
}

function checkQuantity(into: Problem[], where: string, value: unknown): void {
  if (!isObject(value)) {
    into.push(`${where}: expected a quantity object, got ${JSON.stringify(value)}`);
    return;
  }
  if ("min" in value || "max" in value) {
    checkNumber(into, `${where}.min`, value["min"]);
    checkNumber(into, `${where}.max`, value["max"]);
    const { min, max } = value as { min: unknown; max: unknown };
    if (typeof min === "number" && typeof max === "number" && max <= min) {
      into.push(`${where}: range ${min}–${max} is not increasing`);
    }
  } else if ("value" in value) {
    checkNumber(into, `${where}.value`, value["value"]);
  } else {
    into.push(`${where}: quantity needs either {min,max} or {value}`);
  }
}

const SCOPES = new Set(["TH", "KH", "REGIONAL", "UNSTATED"]);
const COUNTRY_VALUES = new Set(["TH", "KH", "NEUTRAL"]);
const RATE_UNITS = new Set(["kg/rai", "kg/ha", "kg/tree", "kg/rai/yr"]);
const MOBILITIES = new Set(["mobile", "immobile"]);

function checkGuidance(into: Problem[], where: string, value: unknown): void {
  if (!isObject(value)) {
    into.push(`${where}: expected a guidance object`);
    return;
  }
  if (!SCOPES.has(String(value["scope"]))) into.push(`${where}.scope: ${String(value["scope"])}`);
  checkString(into, `${where}.text`, value["text"]);

  const grades = value["grades"];
  if (!Array.isArray(grades)) into.push(`${where}.grades: expected an array`);
  else grades.forEach((grade, i) => checkNpk(into, `${where}.grades[${i}]`, grade));

  const rate = value["rate"];
  const unit = value["unit"];
  if (rate !== null) checkQuantity(into, `${where}.rate`, rate);
  if (unit !== null && !RATE_UNITS.has(String(unit))) into.push(`${where}.unit: ${String(unit)}`);
  // A number with no unit is not a rate; it is a trap.
  if (rate !== null && unit === null) into.push(`${where}: has a rate but no unit`);
  if (rate === null && unit !== null) into.push(`${where}: has a unit but no rate`);
}

const ROW_CHECKS: Record<TableId, (into: Problem[], where: string, row: Record<string, unknown>) => void> = {
  "nutrient-groups": (into, where, row) => {
    if (!Array.isArray(row["elements"]) || row["elements"].length === 0)
      into.push(`${where}.elements: expected a non-empty array`);
    const th = (row["labels"] as { th?: Record<string, unknown> })?.th;
    checkString(into, `${where}.labels.th.group`, th?.["group"]);
    checkString(into, `${where}.labels.th.role`, th?.["role"]);
  },
  "deficiency-symptoms": (into, where, row) => {
    if (!Array.isArray(row["elements"]) || row["elements"].length === 0)
      into.push(`${where}.elements: expected a non-empty array`);
    const mobility = row["mobility"];
    if (mobility !== null && !MOBILITIES.has(String(mobility)))
      into.push(`${where}.mobility: ${String(mobility)}`);
    if (!("mobility" in row)) into.push(`${where}.mobility: missing`);
    const th = (row["labels"] as { th?: Record<string, unknown> })?.th;
    checkString(into, `${where}.labels.th.symptom`, th?.["symptom"]);
  },
  "organic-fertilizer-npk": (into, where, row) => {
    checkNpk(into, `${where}.npk`, row["npk"]);
    const th = (row["labels"] as { th?: Record<string, unknown> })?.th;
    checkString(into, `${where}.labels.th.name`, th?.["name"]);
    checkString(into, `${where}.labels.th.note`, th?.["note"]);
  },
  "straight-fertilizers": (into, where, row) => {
    if (!("grade" in row)) into.push(`${where}.grade: missing`);
    else if (row["grade"] !== null) checkNpk(into, `${where}.grade`, row["grade"]);
    if (!("sulphurPercent" in row)) into.push(`${where}.sulphurPercent: missing`);
    else if (row["sulphurPercent"] !== null) checkNumber(into, `${where}.sulphurPercent`, row["sulphurPercent"]);
    const th = (row["labels"] as { th?: Record<string, unknown> })?.th;
    for (const field of ["name", "grade", "character", "useFor"]) {
      checkString(into, `${where}.labels.th.${field}`, th?.[field]);
    }
  },
  "compound-grades": (into, where, row) => {
    const grades = row["grades"];
    if (!Array.isArray(grades) || grades.length === 0) into.push(`${where}.grades: expected a non-empty array`);
    else grades.forEach((grade, i) => checkNpk(into, `${where}.grades[${i}]`, grade));
    const th = (row["labels"] as { th?: Record<string, unknown> })?.th;
    checkString(into, `${where}.labels.th.useFor`, th?.["useFor"]);
  },
  "soil-conditioners": (into, where, row) => {
    if (!("limeEquivalence" in row)) into.push(`${where}.limeEquivalence: missing`);
    else if (row["limeEquivalence"] !== null) checkNumber(into, `${where}.limeEquivalence`, row["limeEquivalence"]);
    const th = (row["labels"] as { th?: Record<string, unknown> })?.th;
    for (const field of ["name", "purpose", "equivalence"]) {
      checkString(into, `${where}.labels.th.${field}`, th?.[field]);
    }
  },
  "rice-by-soil-group-kh": (into, where, row) => {
    if (row["country"] !== "KH") into.push(`${where}.country: every row of this table must be KH`);
    const per = row["perHectare"];
    if (!isObject(per)) into.push(`${where}.perHectare: missing`);
    else {
      const keys = Object.keys(per).sort().join(",");
      if (keys !== "dap,kcl,urea") into.push(`${where}.perHectare keys: ${keys}`);
      for (const key of ["urea", "dap", "kcl"]) checkNumber(into, `${where}.perHectare.${key}`, per[key]);
    }
    if (!("suppliesNpkKgPerHa" in row)) into.push(`${where}.suppliesNpkKgPerHa: missing`);
    else if (row["suppliesNpkKgPerHa"] !== null)
      checkNpkKgPerHa(into, `${where}.suppliesNpkKgPerHa`, row["suppliesNpkKgPerHa"]);
    if (!("rateNote" in row)) into.push(`${where}.rateNote: missing`);
    else if (row["rateNote"] !== null) checkString(into, `${where}.rateNote`, row["rateNote"]);
    const en = (row["labels"] as { en?: Record<string, unknown> })?.en;
    checkString(into, `${where}.labels.en.soil`, en?.["soil"]);
  },
  "other-crops": (into, where, row) => {
    for (const key of ["basal", "topDressing"]) {
      const list = row[key];
      if (!Array.isArray(list)) into.push(`${where}.${key}: expected an array`);
      else list.forEach((g, i) => checkGuidance(into, `${where}.${key}[${i}]`, g));
    }
    checkString(into, `${where}.sourceNote`, row["sourceNote"]);
    const th = (row["labels"] as { th?: Record<string, unknown> })?.th;
    checkString(into, `${where}.labels.th.crop`, th?.["crop"]);
  },
  glossary: (into, where, row) => {
    const labels = row["labels"];
    if (!isObject(labels)) into.push(`${where}.labels: missing`);
    else for (const field of ["th", "en", "zh"]) checkString(into, `${where}.labels.${field}`, labels[field]);
  },
};

/** Throws with every problem found, or returns silently. */
export function assertTables(): void {
  const problems: Problem[] = [];

  for (const id of TABLE_IDS) {
    const table = RAW_TABLES[id] as unknown as Record<string, unknown>;
    const where = id;

    if (table["id"] !== id) problems.push(`${where}: declares id ${String(table["id"])}`);
    const pages = table["sourcePages"];
    if (!Array.isArray(pages) || pages.length === 0) problems.push(`${where}.sourcePages: missing`);
    checkNumber(problems, `${where}.rowCount`, table["rowCount"]);

    const rows = table["rows"];
    if (!Array.isArray(rows)) {
      problems.push(`${where}.rows: expected an array`);
      continue;
    }
    if (rows.length !== table["rowCount"]) {
      problems.push(`${where}: rowCount says ${String(table["rowCount"])}, file has ${rows.length}`);
    }

    const seen = new Set<string>();
    rows.forEach((row: unknown, i) => {
      const at = `${where}.rows[${i}]`;
      if (!isObject(row)) {
        problems.push(`${at}: expected an object`);
        return;
      }
      checkString(problems, `${at}.id`, row["id"]);
      if (typeof row["id"] === "string") {
        if (seen.has(row["id"])) problems.push(`${at}: duplicate id ${row["id"]}`);
        seen.add(row["id"]);
      }
      checkNumber(problems, `${at}.sourcePage`, row["sourcePage"]);
      if (Array.isArray(pages) && !pages.includes(row["sourcePage"])) {
        problems.push(`${at}.sourcePage ${String(row["sourcePage"])} is not one of the table's pages`);
      }
      if (!COUNTRY_VALUES.has(String(row["country"]))) {
        problems.push(`${at}.country: ${String(row["country"])} (expected TH, KH or NEUTRAL)`);
      }
      if (row["citations"] !== undefined) {
        if (!Array.isArray(row["citations"]) || row["citations"].some((c) => typeof c !== "string")) {
          problems.push(`${at}.citations: expected a list of strings`);
        }
      }
      if (row["citationsMore"] !== undefined) checkNumber(problems, `${at}.citationsMore`, row["citationsMore"]);

      ROW_CHECKS[id](problems, at, row);
    });
  }

  if (problems.length > 0) {
    throw new Error(`table data is malformed:\n  ${problems.join("\n  ")}`);
  }
}
