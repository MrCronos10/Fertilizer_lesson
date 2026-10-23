import { expect, test } from "@playwright/test";
import { collectPageProblems } from "./console";

test("the source lines sit under the paragraph and the card, with their tier and the extra-sources link", async ({ page }) => {
  const problems = collectPageProblems(page);
  await page.goto("/th/ch01");
  const lines = page.locator(".reading-column .cite-line");
  await expect(lines).toHaveCount(2);
  await expect(lines.nth(0)).toContainText("ที่มา");
  await expect(lines.nth(0).locator("a[data-cite]")).toHaveText("Department of Agriculture (Thailand)");
  await expect(lines.nth(0).locator('[data-tier="official"]')).toHaveCount(1);
  await expect(lines.nth(1).locator("a[data-cite]")).toHaveText("University of Georgia, CAES");
  await expect(lines.nth(1).locator('[data-tier="research"]')).toHaveCount(1);
  await expect(lines.nth(1).locator(".cite-more")).toHaveText("และอีก 2 แหล่ง");
  for (const a of await lines.locator("a").all()) expect((await a.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await lines.nth(0).locator("a[data-cite]").click();
  await expect(page).toHaveURL(/#src-doa$/);
  expect(problems).toEqual([]);
});

test("the p2 table keeps its words and gains the N, P and K chips", async ({ page }) => {
  await page.goto("/th/ch01");
  const row = page.locator('.nutrient-groups tr[data-row="macronutrients"]');
  await expect(row.locator(".npk-chip")).toHaveText(["N", "P", "K"]);
  await expect(row.locator("td").nth(0)).toHaveText("N, P, K");
  await expect(row.locator("td").nth(1)).toHaveText("N = ใบเขียว โตเร็ว; P = ราก ดอก เมล็ด; K = ผลโต หวาน ต้นแข็ง ทนโรค");
  await expect(page.locator(".nutrient-groups figcaption")).toHaveText(/หน้าในเอกสารต้นฉบับ: 2/);
});

test("the deficiency card has its own h2 and colours the two leaf words", async ({ page }) => {
  await page.goto("/th/ch01");
  const card = page.locator(".chapter-card");
  await expect(card.getByRole("heading", { level: 2, name: "อาการขาดธาตุ" })).toHaveCount(1);
  await expect(card.locator("strong")).toHaveText(["ใบแก่", "ใบอ่อน/ยอด"]);
});

test("nothing the page had before is gone: the symptom table, the warning, the numbers and the 3D plant stay", async ({ page }) => {
  await page.goto("/th/ch01");
  await expect(page.locator('tr[data-row="mg"], table.source-table tr[data-row]').first()).toBeVisible();
  await expect(page.locator("table.source-table")).toHaveCount(2);
  await expect(page.locator('[data-callout="warn"]')).toContainText("ส่งดินตรวจ");
  await expect(page.locator(".nums")).toHaveCount(1);
  await expect(page.locator(".side-column .deficiency")).toHaveCount(1);
  await expect(page.locator(".side-column #sources")).toHaveCount(1);
});

test("two columns at 1366 and one at 834, with no sideways scroll", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/th/ch01");
  const reading = (await page.locator(".reading-column").boundingBox())!;
  const side = (await page.locator(".side-column").boundingBox())!;
  expect(reading.width).toBeLessThanOrEqual(700.5);
  expect(side.x).toBeGreaterThan(reading.x + reading.width);
  await page.setViewportSize({ width: 834, height: 1100 });
  const stacked = (await page.locator(".side-column").boundingBox())!;
  expect(stacked.y).toBeGreaterThan(reading.y + 100);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("the footer offers the contents and the next chapter as outlined buttons (the explorer is the primary one, T-041)", async ({ page }) => {
  await page.goto("/th/ch01");
  const nav = page.locator(".chapter-nav");
  await expect(nav.getByRole("link", { name: "สารบัญ" })).toHaveAttribute("href", "/th");
  await expect(nav.locator('a[rel="next"]')).toBeVisible();
  for (const a of await nav.locator("a").all()) expect((await a.boundingBox())!.height).toBeGreaterThanOrEqual(44);
});

test("the opening paragraph fills the 700 px column in landscape (no 62-character cap) and keeps it in portrait", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/th/ch01");
  const lead = page.locator(".reading-column > p").first();
  expect((await lead.boundingBox())!.width).toBeGreaterThanOrEqual(690);
  await page.setViewportSize({ width: 834, height: 1100 });
  expect(await lead.evaluate((el) => getComputedStyle(el).maxWidth)).not.toBe("none");
  expect((await lead.boundingBox())!.width).toBeLessThan(640);
});
