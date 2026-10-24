import { expect, test } from "@playwright/test";

/** Chapter 6 in the redesign (T-050): the band, and the p14 glossary drawn at last, in a card. */
const ROUTE = "/th/ch06";

test("the band names chapter 6 and shows its drawn scene", async ({ page }) => {
  await page.goto(ROUTE);
  await expect(page.locator(".chapter-band .chapter-badge")).toHaveText("บทที่ 6");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("อภิธานศัพท์");
  await expect(page.locator(".chapter-band-scene:visible")).toHaveCount(1);
});

test("the glossary is a real table of twenty terms in a card, named, with the source's three column headers", async ({ page }) => {
  await page.goto(ROUTE);
  const table = page.locator("article > .chapter-card").getByRole("table", { name: "อภิธานศัพท์" });
  await expect(table).toBeVisible();
  await expect(table.getByRole("columnheader")).toHaveText(["ไทย", "English", "中文"]);
  await expect(table.locator("tbody tr")).toHaveCount(20);
  await expect(table.locator("tbody tr").first().getByRole("rowheader")).toHaveText("ปุ๋ย");
  await expect(table.locator('tbody tr[data-row="urea"] td[lang="en"]')).toHaveText("Urea");
  await expect(page.locator("article > .chapter-card .table-figure figcaption")).toHaveText("หน้าในเอกสารต้นฉบับ: 14");
});

test("on a phone the table scrolls inside its own box, never the page, down to 320", async ({ page }) => {
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(ROUTE);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${width}`).toBe(true);
  }
});
