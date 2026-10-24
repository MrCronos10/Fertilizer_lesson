import { expect, test } from "@playwright/test";

/** Chapter 7's page shell in the redesign (T-052), from Quiz-Landscape/Portrait.dc.html; the quiz's own layout is T-053. */
const ROUTE = "/th/ch07";

test("the band names chapter 7 and is the Quiz artboards': 150 px and a 640 px card in landscape, 200 px and 540 in portrait", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 1024 });
  await page.goto(ROUTE);
  await expect(page.locator(".chapter-band .chapter-badge")).toHaveText("บทที่ 7");
  await expect(page.locator(".chapter-band-count")).toHaveText("บทที่ 7 จาก 7");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("สรุปและแบบทดสอบ");
  expect((await page.locator(".chapter-band-art").boundingBox())!.height).toBeCloseTo(150, 0);
  expect((await page.locator(".chapter-band-card").boundingBox())!.width).toBeCloseTo(640, 0);
  await page.setViewportSize({ width: 834, height: 1194 });
  expect((await page.locator(".chapter-band-art").boundingBox())!.height).toBeCloseTo(200, 0);
  expect((await page.locator(".chapter-band-card").boundingBox())!.width).toBeCloseTo(540, 0);
  await expect(page.locator(".chapter-band-scene:visible")).toHaveCount(1);
});

test("the summary is one card of six numbered points on page 6, still marked uncited", async ({ page }) => {
  await page.goto(ROUTE);
  const card = page.locator('article > [data-section="summary"]');
  await expect(card).toHaveClass(/chapter-section/);
  await expect(card.locator("ol > li")).toHaveCount(6);
  await expect(card.locator("ol > li").nth(3)).toHaveText("กลบยูเรียทุกครั้ง");
  await expect(card.locator(".chapter-section-page")).toHaveText("หน้าในเอกสารต้นฉบับ: 6");
  await expect(card.locator("[data-uncited]")).toHaveCount(1);
});

test("the quiz still works under the summary, and the sources card and footer follow", async ({ page }) => {
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  const summary = (await page.locator('[data-section="summary"]').boundingBox())!;
  const quiz = page.locator(".quiz");
  await expect(quiz).toBeVisible();
  expect((await quiz.boundingBox())!.y).toBeGreaterThan(summary.y + summary.height);
  await page.getByRole("button", { name: /ดูคำตอบ/ }).first().click();
  await expect(page.getByText("N อย่างเดียว")).toBeVisible();
  await expect(page.locator("#sources")).toHaveClass(/sources-card/);
  await expect(page.locator('.chapter-nav a[rel="prev"]')).toBeVisible();
  await expect(page.locator(".chapter-nav a[rel='next']")).toHaveCount(0);
});

test("the headings line up with the 860 px cards in landscape (only the quiz is wider), and nothing scrolls sideways down to 320", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 1024 });
  await page.goto(ROUTE);
  const card = (await page.locator('[data-section="summary"]').boundingBox())!;
  expect(card.width).toBeCloseTo(860, 0);
  const quiz = (await page.locator("article > .quiz").boundingBox())!;
  expect(quiz.width).toBeCloseTo(1286, 0);
  expect((await page.locator("article > h2:has(+ .quiz)").boundingBox())!.x).toBeCloseTo(quiz.x, 0);
  expect((await page.locator("article > h2").first().boundingBox())!.x).toBeCloseTo(card.x, 0);
  for (const width of [834, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${width}`).toBe(true);
  }
});
