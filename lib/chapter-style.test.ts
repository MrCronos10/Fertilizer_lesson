import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("chapter.css, the redesigned chapters' stylesheet", () => {
  const css = readFileSync(join(process.cwd(), "app/[locale]/[slug]/chapter.css"), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/@[^{]+\{/g, "{"); // an at-rule's prelude is not a selector
  const blocks = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selector: m[1]!.trim(), body: m[2]! }));

  it("scopes every rule to the redesigned chapter, so its class names never reach another chapter", () => {
    const selectors = blocks.flatMap((b) => b.selector.split(/,(?![^(]*\))/).map((x) => x.trim())).filter(Boolean);
    expect(selectors.length).toBeGreaterThan(80);
    expect(selectors.filter((x) => !/(^|\s)\.chapter-redesign(\s|$|[.:\[>])/.test(x))).toEqual([]);
  });

  it("uses only min-width queries, so there is one set of breakpoints and no 74.99em boundary", () => {
    const queries = [...readFileSync(join(process.cwd(), "app/[locale]/[slug]/chapter.css"), "utf8").matchAll(/@media\s*\(([^)]*)\)/g)].map((m) => m[1]);
    expect(queries.length).toBeGreaterThan(0);
    expect([...new Set(queries)].sort()).toEqual(["min-width: 40em", "min-width: 75em"]);
  });

  it("reads every layout value it defines: no custom property is declared and never used", () => {
    const declared = new Set([...css.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]!));
    const used = new Set([...css.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]!));
    // --icon is set per arrow and read by the shared mask rule.
    expect([...declared].filter((d) => !used.has(d))).toEqual([]);
  });
});
