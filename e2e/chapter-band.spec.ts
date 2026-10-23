import { expect, test, type Page } from "@playwright/test";

/** The header band of redesigned chapters after the first (T-044), from the Bag-Calculator artboards; chapter 3 first. */
const ROUTE = "/th/ch03";
const band = (page: Page) => page.locator(".chapter-band");

test("the bar goes back to the contents and says which chapter this is; one h1, the chapter's title", async ({ page }) => {
  await page.goto(ROUTE);
  const back = band(page).getByRole("link", { name: "สารบัญ", exact: true });
  await expect(back).toHaveAttribute("href", "/th");
  expect((await back.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await expect(band(page).locator(".chapter-band-count")).toHaveText("บทที่ 3 จาก 7");
  await expect(band(page).locator(".chapter-badge")).toHaveText("บทที่ 3");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("วิธีอ่านตัวเลขบนกระสอบ");
});

for (const [width, height, card] of [
  [1366, 160, 700],
  [834, 180, 560],
] as const) {
  test(`at ${width} the band is the artboard's ${height} px with its ${card} px title card, and one picture shows`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1024 });
    await page.goto(ROUTE);
    const art = (await band(page).locator(".chapter-band-art").boundingBox())!;
    expect(art.height).toBeCloseTo(height, 0);
    expect(art.width).toBeCloseTo(width, 0);
    expect((await band(page).locator(".chapter-band-card").boundingBox())!.width).toBeCloseTo(card, 0);
    await expect(band(page).locator(".chapter-band-scene:visible")).toHaveCount(1);
    await expect(band(page).locator(".chapter-band-scene").first()).toHaveAttribute("aria-hidden", "true");
  });
}

test("on a phone the card sits under the picture, and nothing scrolls sideways down to 320", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(ROUTE);
  const card = (await band(page).locator(".chapter-band-card").boundingBox())!;
  const art = (await band(page).locator(".chapter-band-art").boundingBox())!;
  expect(card.y - art.y).toBeGreaterThanOrEqual(100);
  expect(card.width).toBeCloseTo(390, 0);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${width}`).toBe(true);
  }
});

test("landscape: the bag reader's column is the artboard's 620 px, with the calculator beside it", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 1024 });
  await page.goto(ROUTE);
  const left = (await page.locator(".reading-column").boundingBox())!;
  const right = (await page.locator(".side-column").boundingBox())!;
  expect(left.width).toBeCloseTo(620, 0);
  expect(right.x - (left.x + left.width)).toBeCloseTo(40, 0);
  await expect(page.locator(".reading-column .bag-reader")).toBeVisible();
  await expect(page.locator(".side-column .calculator")).toBeVisible();
});

test("the footer's primary button is the next chapter (no explorer here), and the explorer button is absent", async ({ page }) => {
  await page.goto(ROUTE);
  const next = page.locator('.chapter-nav a[rel="next"]');
  await expect(next).toHaveAttribute("href", "/th/ch04");
  await expect(next).toHaveClass(/chapter-primary/);
  await expect(page.locator(".chapter-nav .chapter-explore")).toHaveCount(0);
  const brand = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--brand").trim());
  const bg = await next.evaluate((el) => getComputedStyle(el).backgroundColor);
  const probe = await page.evaluate((c) => {
    const s = document.createElement("span");
    s.style.color = c;
    document.body.append(s);
    const v = getComputedStyle(s).color;
    s.remove();
    return v;
  }, brand);
  expect(bg).toBe(probe);
});
