import { expect, test } from "@playwright/test";
import { collectPageProblems } from "./console";

test("chapter 1's hero: one h1, the badge and progress line, a back link, and no text in the picture", async ({ page }) => {
  const problems = collectPageProblems(page);
  await page.goto("/th/ch01");
  const hero = page.locator(".chapter-hero");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(hero.getByRole("heading", { level: 1 })).toHaveText("บทที่ 1 ปุ๋ยคืออะไร และพืชต้องการธาตุอาหารอะไร");
  await expect(hero.locator(".chapter-where")).toHaveText("บทที่ 1บทที่ 1 จาก 7");
  await expect(hero.locator(".chapter-steps span")).toHaveCount(7);
  await expect(hero.locator(".chapter-steps span[data-done]")).toHaveCount(1);
  await expect(hero.locator("svg.chapter-hero-art")).toHaveAttribute("aria-hidden", "true");
  expect(await hero.locator("svg.chapter-hero-art text").count()).toBe(0);
  expect(problems).toEqual([]);
});

test("the back pill is a 44 px link to the home page", async ({ page }) => {
  await page.goto("/th/ch01");
  const back = page.locator(".chapter-back");
  await expect(back).toHaveText("หน้าแรก");
  await expect(back).toHaveAttribute("href", "/th");
  expect((await back.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await back.click();
  await expect(page).toHaveURL(/\/th$/);
});

test("the sources bar lists only the tiers chapter 1 cites, and its link lands on the sources", async ({ page }) => {
  await page.goto("/th/ch01");
  const bar = page.locator(".jump-sources");
  await expect(bar.locator(".tier-legend")).toContainText("ระดับแหล่งข้อมูลในบทนี้");
  await expect(bar.locator(".tier")).toHaveCount(2);
  await expect(bar.locator('[data-tier="official"]')).toHaveCount(1);
  await expect(bar.locator('[data-tier="research"]')).toHaveCount(1);
  await bar.getByRole("link", { name: "ไปที่ที่มาของข้อมูล" }).click();
  await expect(page).toHaveURL(/#sources$/);
});

test("the hero runs edge to edge with no sideways scroll, and other chapters keep their old top", async ({ page }) => {
  await page.goto("/th/ch01");
  const box = await page.locator(".chapter-hero").boundingBox();
  const width = await page.evaluate(() => document.documentElement.clientWidth);
  expect(box!.x).toBeLessThanOrEqual(0.5);
  expect(box!.width).toBeGreaterThanOrEqual(width - 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.goto("/th/ch02");
  await expect(page.locator(".chapter-hero")).toHaveCount(0);
  await expect(page.locator(".jump-sources .tier-legend")).toHaveCount(0);
});
