import { expect, test } from "@playwright/test";

/** Chapter 5 in the redesign (T-049): the band, the crop matcher in a card, the sources card after it. */
const ROUTE = "/th/ch05";

test("the band names chapter 5 and shows its drawn scene", async ({ page }) => {
  await page.goto(ROUTE);
  await expect(page.locator(".chapter-band .chapter-badge")).toHaveText("บทที่ 5");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("ตารางจับคู่ปุ๋ยกับพืช");
  await expect(page.locator(".chapter-band-scene:visible")).toHaveCount(1);
});

test("the crop matcher sits in one card, its chosen crop's panel plain inside it, and still answers", async ({ page }) => {
  await page.goto(ROUTE);
  const card = page.locator("article > .chapter-card");
  await expect(card).toHaveCount(1);
  await expect(card.locator(".crop-matcher")).toBeVisible();
  expect(await card.locator(".crop-panel .panel").first().evaluate((el) => getComputedStyle(el).borderTopStyle)).toBe("none");
  await card.getByRole("radio", { name: "ข้าวโพด" }).check();
  await expect(card.locator(".crop-panel .crop-name")).toHaveText("ข้าวโพด");
  for (const label of await card.locator(".def-option").all()) expect((await label.boundingBox())!.height).toBeGreaterThanOrEqual(44);
});

test("on a phone the scene shows above the title card, not under it", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(ROUTE);
  const scene = (await page.locator(".chapter-band-scene:visible").boundingBox())!;
  const card = (await page.locator(".chapter-band-card").boundingBox())!;
  expect(scene.y + scene.height).toBeLessThanOrEqual(card.y + 1);
});

test("the sources card follows the matcher, and nothing scrolls sideways down to 320", async ({ page }) => {
  await page.goto(ROUTE);
  await expect(page.locator("#sources")).toHaveClass(/sources-card/);
  for (const width of [834, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${width}`).toBe(true);
  }
});
