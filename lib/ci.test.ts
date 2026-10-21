import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CHAPTER_SLUGS, FONT_BUDGET_BYTES, TEXT_JS_BUDGET_BYTES, THREE_D_JS_BUDGET_BYTES } from "./budget";

/**
 * T-024 guards the guards: the budget only fails a build if CI runs it, and CI only runs what the
 * workflow file lists. These fail when a step is dropped, or a number drifts from D16.
 */
const read = (f: string) => readFileSync(join(process.cwd(), f), "utf8");
const workflow = read(".github/workflows/ci.yml");
const pkg = JSON.parse(read("package.json")) as { scripts: Record<string, string> };
const lighthouse = read("scripts/lighthouse.mjs");
const decisions = read("docs/DECISIONS.md");

describe("the numbers are D16's", () => {
  it("text 180 KB, 3D 600 KB, fonts 60 KB", () => {
    expect([TEXT_JS_BUDGET_BYTES, THREE_D_JS_BUDGET_BYTES, FONT_BUDGET_BYTES]).toEqual([180 * 1024, 600 * 1024, 60 * 1024]);
    expect(decisions).toContain("Text routes ≤ 180 KB gzipped JS");
    expect(decisions).toContain("3D routes ≤ 600 KB");
    expect(decisions).toContain("≤ 60 KB woff2");
    expect(decisions).toContain("Lighthouse performance ≥ 90, accessibility = 100");
  });

  it("Lighthouse is held to performance 90, accessibility 100 and LCP 2.0 s", () => {
    expect(lighthouse).toContain("const BUDGET = { performance: 90, accessibility: 100, lcpMs: 2000 };");
  });

  it("Lighthouse covers the home page and every chapter", () => {
    expect(lighthouse).toContain('{ path: "/th", text: true }');
    expect(lighthouse).toContain('{ path: "/th/ch01", text: false }');
    for (const n of ["02", "03", "04", "05", "06", "07"]) expect(lighthouse).toContain(`"${n}"`);
    expect(CHAPTER_SLUGS).toHaveLength(7);
  });
});

describe("CI runs everything that enforces them", () => {
  it.each([
    ["types", "npm run typecheck"],
    ["lint", "npm run lint"],
    ["unit tests (fonts, route coverage, this file)", "npm test"],
    ["the WebKit e2e, which includes e2e/budget.spec.ts", "npm run test:e2e"],
    ["Lighthouse", "npm run perf:lighthouse"],
    ["a browser for the e2e", "playwright install --with-deps webkit"],
  ])("%s", (_name, step) => {
    expect(workflow).toContain(step);
  });

  it("runs on pushes to main and task branches, and on pull requests", () => {
    expect(workflow).toMatch(/push:\s+branches: \[main, "task\/\*\*"\]/);
    expect(workflow).toContain("pull_request:");
  });

  it("is not told to ignore a failure", () => {
    expect(workflow).not.toContain("continue-on-error");
    expect(workflow).not.toMatch(/\|\|\s*true/);
  });

  it("has the scripts the workflow calls", () => {
    for (const name of ["typecheck", "lint", "test", "test:e2e", "perf:lighthouse"]) expect(pkg.scripts[name], name).toBeTruthy();
  });
});
