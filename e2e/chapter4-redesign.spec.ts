import { expect, test } from "@playwright/test";

/** Chapter 4 in the redesign (T-048): the band, the five sections as cards, the three warnings marked by more than colour. */
const ROUTE = "/th/ch04";

test("the band names chapter 4 and shows its drawn scene", async ({ page }) => {
  await page.goto(ROUTE);
  await expect(page.locator(".chapter-band .chapter-badge")).toHaveText("บทที่ 4");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("การใส่ปุ๋ยในทางปฏิบัติ");
  await expect(page.locator(".chapter-band-scene:visible")).toHaveCount(1);
});

test("the five sections are cards with the brand edge; each still states its page", async ({ page }) => {
  await page.goto(ROUTE);
  const sections = page.locator("article > .chapter-section");
  await expect(sections).toHaveCount(5);
  for (const s of await sections.all()) {
    expect(await s.evaluate((el) => getComputedStyle(el).borderTopWidth)).toBe("5px");
    await expect(s.locator(".chapter-section-page")).toHaveText("หน้าในเอกสารต้นฉบับ: 6");
  }
});

test("a warning section carries a warning sign as well as its colour; the others do not", async ({ page }) => {
  await page.goto(ROUTE);
  const sign = (id: string) =>
    page.locator(`[data-section="${id}"]`).evaluate((el) => getComputedStyle(el, "::before").content);
  for (const id of ["safety", "mistakes", "environment"]) expect(await sign(id), id).not.toBe("none");
  for (const id of ["four-r", "practice"]) expect(await sign(id), id).toBe("none");
});

test("landscape cards are one 860 px column, and nothing scrolls sideways down to 320", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 1024 });
  await page.goto(ROUTE);
  expect((await page.locator("article > .chapter-section").first().boundingBox())!.width).toBeCloseTo(860, 0);
  for (const width of [834, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${width}`).toBe(true);
  }
});
