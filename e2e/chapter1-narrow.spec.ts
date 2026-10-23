import { expect, test, type Page } from "@playwright/test";
import { collectPageProblems } from "./console";

const visible = (page: Page, sel: string) => page.locator(sel).evaluate((el) => getComputedStyle(el).display !== "none");
const noSideways = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

test("landscape draws the wide picture, portrait and phone draw the portrait one", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/th/ch01");
  expect(await visible(page, ".art-landscape")).toBe(true);
  expect(await visible(page, ".art-portrait")).toBe(false);
  for (const width of [834, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await visible(page, ".art-landscape"), `${width}`).toBe(false);
    expect(await visible(page, ".art-portrait"), `${width}`).toBe(true);
  }
});

test("portrait (834): one column of 640 px, the artboard's title card, the plant beside the answer, sources under a rule", async ({ page }) => {
  const problems = collectPageProblems(page);
  await page.setViewportSize({ width: 834, height: 1100 });
  await page.goto("/th/ch01", { waitUntil: "networkidle" });
  const title = (await page.locator(".chapter-title-card").boundingBox())!;
  expect(title.width).toBeCloseTo(578, 0);
  expect(await page.locator(".chapter-title-card h1").evaluate((el) => getComputedStyle(el).fontSize)).toBe("32px");
  expect((await page.locator(".chapter-steps span").first().boundingBox())!.width).toBeCloseTo(46, 0);
  const reading = (await page.locator(".reading-column").boundingBox())!;
  const side = (await page.locator(".side-column").boundingBox())!;
  expect(reading.width).toBeLessThanOrEqual(640.5);
  expect(side.y).toBeGreaterThan(reading.y + reading.height - 1);
  await page.locator(".def-scene").scrollIntoViewIfNeeded();
  const scene = (await page.locator(".def-scene").boundingBox())!;
  const panel = (await page.locator(".def-panel").boundingBox())!;
  expect(scene.width).toBeCloseTo(236, 0);
  expect(panel.x).toBeGreaterThan(scene.x + scene.width);
  const sources = page.locator("section#sources");
  expect(await sources.evaluate((el) => getComputedStyle(el).borderTopWidth)).toBe("1px");
  expect(await sources.evaluate((el) => getComputedStyle(el).borderLeftWidth)).toBe("0px");
  expect(await noSideways(page)).toBe(true);
  expect(problems).toEqual([]);
});

for (const width of [390, 320]) {
  test(`phone (${width}): nothing runs off the screen, targets stay 44 px, the plant sits above the answer`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/th/ch01", { waitUntil: "networkidle" });
    expect(await noSideways(page)).toBe(true);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const heroBox = (await page.locator(".chapter-hero").boundingBox())!;
    expect(heroBox.width).toBeGreaterThanOrEqual(width - 1);
    const steps = await page.locator(".chapter-steps span").all();
    for (const step of steps) {
      const b = (await step.boundingBox())!;
      expect(b.x + b.width).toBeLessThanOrEqual(width);
    }
    for (const sel of [".chapter-back", ".jump-sources a", ".cite-line > a", ".chapter-nav a"])
      for (const el of await page.locator(sel).all()) expect((await el.boundingBox())!.height, sel).toBeGreaterThanOrEqual(44);
    await page.locator(".def-scene").scrollIntoViewIfNeeded();
    const scene = (await page.locator(".def-scene").boundingBox())!;
    const panel = (await page.locator(".def-panel").boundingBox())!;
    expect(panel.y).toBeGreaterThan(scene.y + scene.height - 1);
    expect(panel.x + panel.width).toBeLessThanOrEqual(width);
  });
}

test("the title stays readable against the picture in dark mode too", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 834, height: 1100 });
  await page.goto("/th/ch01");
  const ratio = await page.evaluate(() => {
    const rgb = (s: string) => (s.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    const lum = ([r, g, b]: number[]) => {
      const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!);
    };
    const h1 = getComputedStyle(document.querySelector(".chapter-title-card h1")!);
    const card = getComputedStyle(document.querySelector(".chapter-title-card")!);
    const [a, b] = [lum(rgb(h1.color)), lum(rgb(card.backgroundColor))];
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  });
  expect(ratio).toBeGreaterThanOrEqual(4.5);
});
