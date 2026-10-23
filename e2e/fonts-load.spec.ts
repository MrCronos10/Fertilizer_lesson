import { expect, test } from "@playwright/test";
import { ROUTES } from "../lib/budget";

/*
 * WebKit stops firing `load` (readyState stuck at "interactive", nothing outstanding) when a
 * preloaded font file is first asked for after its preload has finished (T-027; the same family
 * as T-014's select bug). Bisected: removing the six preloads cured it (0 of 60 stalls) but cost
 * chapter 4 its performance score (86, the font swap shifts the text, as T-024 found); forcing font
 * loads after DOMContentLoaded made it stall 55 of 60 times. The cure that keeps the preloads is
 * `.font-warm` in the root layout: every face is used by the very first layout, so no page can
 * later ask for one for the first time. The stall is intermittent (about 15% of chapter walks
 * before the fix), so this walks the chapters twice; e2e/citations.spec.ts and the chapter 3
 * canaries in calculator and bag specs are the other guards.
 */
test("chapters keep reaching `load` when walked one after another", async ({ page }) => {
  for (let round = 0; round < 2; round++)
    for (const route of ROUTES.filter((r) => r.path.startsWith("/th/"))) {
      await page.goto(route.path, { timeout: 10_000 });
      expect(await page.evaluate(() => document.readyState), route.path).toBe("complete");
    }
});
