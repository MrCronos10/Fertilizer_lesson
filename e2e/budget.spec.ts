import { mkdirSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { expect, test, type Page, type Response } from "@playwright/test";
import { FONT_BUDGET_BYTES, ROUTES, jsBudgetFor } from "../lib/budget";

/**
 * T-024: the budget as a build failure. Every route is loaded in a real browser and every response
 * it fetches is measured: JavaScript gzipped (what a user downloads), fonts as served. Measured
 * rather than read from the build, because a lazily imported chunk (the calculator, the plant) is
 * fetched after hydration and would be missed by the HTML. The weights are written to
 * test-results/page-weights-<project>.json and printed, so they can be recorded.
 */
/** Scroll to the bottom in steps, so lazy-loaded parts (the 3D plant) are fetched, then let the network settle. */
async function readToTheEnd(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= height; y += 400) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(60);
  }
  await page.waitForLoadState("networkidle");
}

type Weights = { path: string; kind: string; jsGz: number; cssGz: number; htmlGz: number; fontBytes: number[]; scripts: number; hasThree: boolean };

test("every route stays inside its JavaScript budget, and fonts inside theirs", async ({ page }, info) => {
  const results: Weights[] = [];
  for (const route of ROUTES) {
    const pending: Promise<void>[] = [];
    const w: Weights = { path: route.path, kind: route.kind, jsGz: 0, cssGz: 0, htmlGz: 0, fontBytes: [], scripts: 0, hasThree: false };
    const onResponse = (r: Response) => {
      const url = r.url();
      pending.push(
        r.body().then((b) => {
          if (/\.js(\?|$)/.test(url)) {
            w.jsGz += gzipSync(b).length;
            w.scripts += 1;
            if (b.includes("WebGLRenderer")) w.hasThree = true;
          } else if (/\.css(\?|$)/.test(url)) w.cssGz += gzipSync(b).length;
          else if (/\.woff2(\?|$)/.test(url)) w.fontBytes.push(b.length);
          else if (r.request().resourceType() === "document") w.htmlGz += gzipSync(b).length;
        }).catch(() => undefined),
      );
    };
    page.on("response", onResponse);
    await page.goto(route.path, { waitUntil: "networkidle" });
    // Read to the end, as a reader would: anything that loads when it comes near the screen counts.
    await readToTheEnd(page);
    page.off("response", onResponse);
    await Promise.all(pending);
    results.push(w);
  }

  mkdirSync("test-results", { recursive: true });
  writeFileSync(`test-results/page-weights-${info.project.name}.json`, JSON.stringify(results, null, 2));
  const table = results.map((w) => `${w.path.padEnd(16)} ${w.kind.padEnd(5)} JS ${(w.jsGz / 1024).toFixed(1).padStart(6)} KB gz (${w.scripts} files, budget ${jsBudgetFor(w.kind as "text" | "3d") / 1024} KB)  CSS ${(w.cssGz / 1024).toFixed(1)} KB  HTML ${(w.htmlGz / 1024).toFixed(1)} KB  fonts ${w.fontBytes.length}`);
  console.log(`\n[${info.project.name}] page weights\n${table.join("\n")}`);

  for (const w of results) {
    const budget = jsBudgetFor(w.kind as "text" | "3d");
    expect(w.scripts, `${w.path}: measured no scripts`).toBeGreaterThan(0);
    expect(w.jsGz, `${w.path} (${w.kind}) ships ${(w.jsGz / 1024).toFixed(1)} KB gzipped JS, over its ${budget / 1024} KB budget`).toBeLessThanOrEqual(budget);
    for (const f of w.fontBytes) expect(f, `${w.path}: a font is ${(f / 1024).toFixed(1)} KB`).toBeLessThanOrEqual(FONT_BUDGET_BYTES);
  }
});

test("three.js is on exactly the routes the budget calls 3D", async ({ page }) => {
  for (const route of ROUTES) {
    let hasThree = false;
    const pending: Promise<void>[] = [];
    const onResponse = (r: Response) => {
      if (/\.js(\?|$)/.test(r.url())) pending.push(r.body().then((b) => { if (b.includes("WebGLRenderer")) hasThree = true; }).catch(() => undefined));
    };
    page.on("response", onResponse);
    await page.goto(route.path, { waitUntil: "networkidle" });
    await readToTheEnd(page);
    page.off("response", onResponse);
    await Promise.all(pending);
    expect(hasThree, `${route.path} is "${route.kind}"`).toBe(route.kind === "3d");
  }
});

test("all six font faces are preloaded, so the Latin ones cannot arrive late and re-render the text (CLS 0.23 on chapter 4 before)", async ({ request }) => {
  for (const path of ["/th", "/th/ch04"]) {
    const html = await (await request.get(path)).text();
    const preloaded = [...html.matchAll(/<link rel="preload" href="\/fonts\/([^"]+\.woff2)" as="font"/g)].map((m) => m[1]);
    expect(preloaded.sort(), path).toEqual([
      "noto-sans-thai-700-latin.woff2",
      "noto-sans-thai-700-thai.woff2",
      "sarabun-400-latin.woff2",
      "sarabun-400-thai.woff2",
      "sarabun-600-latin.woff2",
      "sarabun-600-thai.woff2",
    ]);
  }
});
