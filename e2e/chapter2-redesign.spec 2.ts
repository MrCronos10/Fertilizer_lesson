import { expect, test } from "@playwright/test";

/** Chapter 2 in the redesign (T-047): the band, the eight sections as cards, the sources card after them. */
const ROUTE = "/th/ch02";

test("the band names chapter 2 and shows its drawn scene", async ({ page }) => {
  await page.goto(ROUTE);
  await expect(page.locator(".chapter-band .chapter-badge")).toHaveText("บทที่ 2");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("ประเภทของปุ๋ย ลักษณะ และควรใช้กับอะไร");
  await expect(page.locator(".chapter-band-scene:visible")).toHaveCount(1);
});

test("the eight sections, 2.1 to 2.8, are cards in order, each opening with its own heading", async ({ page }) => {
  await page.goto(ROUTE);
  const cards = page.locator("article > .chapter-card");
  await expect(cards).toHaveCount(8);
  for (let i = 0; i < 8; i++) await expect(cards.nth(i).locator("> h2").first()).toHaveText(new RegExp(`^2\\.${i + 1} `));
  // The four source tables and the timing diagram sit inside their cards.
  await expect(page.locator(".chapter-card .table-figure")).toHaveCount(4);
  await expect(page.locator(".chapter-card").nth(6).locator("svg, figure").first()).toBeVisible();
  // No bold word is coloured as chapter 1's old/young leaves are.
  const coloured = await page.locator(".chapter-card p strong").evaluateAll((els) =>
    els.filter((el) => getComputedStyle(el).color !== getComputedStyle(el.parentElement!).color).length,
  );
  expect(coloured).toBe(0);
});

test("the sources card follows the cards, with the soil-test strip; one #sources", async ({ page }) => {
  await page.goto(ROUTE);
  await expect(page.locator("#sources")).toHaveCount(1);
  await expect(page.locator("#sources")).toHaveClass(/sources-card/);
  const last = (await page.locator("article > .chapter-card").last().boundingBox())!;
  expect((await page.locator("#sources").boundingBox())!.y).toBeGreaterThan(last.y + last.height);
  await expect(page.locator("#sources .safe-strip")).toBeVisible();
});

test("landscape cards are one 860 px column; tables never push the page sideways down to 320", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 1024 });
  await page.goto(ROUTE);
  expect((await page.locator("article > .chapter-card").first().boundingBox())!.width).toBeCloseTo(860, 0);
  for (const width of [834, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${width}`).toBe(true);
  }
});

test("the footer's primary button goes on to chapter 3", async ({ page }) => {
  await page.goto(ROUTE);
  await expect(page.locator('.chapter-nav a[rel="next"]')).toHaveClass(/chapter-primary/);
  await expect(page.locator('.chapter-nav a[rel="next"]')).toHaveAttribute("href", "/th/ch03");
});
