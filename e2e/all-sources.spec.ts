import { expect, test } from "@playwright/test";

/** The all-sources page (T-055): every source the pamphlet cites, a card per tier. The grouping is lib/all-sources.test.ts. */
const ROUTE = "/th/sources";

test("the band carries the title only: no chapter badge, count or scene; the tier legend under it", async ({ page }) => {
  await page.goto(ROUTE);
  await expect(page).toHaveTitle(/ที่มาของข้อมูลทั้งหมด/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("ที่มาของข้อมูลทั้งหมด");
  await expect(page.locator(".chapter-band .chapter-badge, .chapter-band-count, .chapter-band-scene")).toHaveCount(0);
  await expect(page.locator(".jump-sources .tier-legend .tier")).toHaveCount(3);
});

test("one card per tier, in the legend's order, and every source and linked document once", async ({ page }) => {
  await page.goto(ROUTE);
  const cards = page.locator("article > section.chapter-card");
  await expect(cards).toHaveCount(3);
  expect(await cards.evaluateAll((els) => els.map((el) => el.getAttribute("data-tier")))).toEqual(["official", "research", "commercial"]);
  await expect(cards.nth(0).getByRole("heading", { level: 2 })).toHaveText(/ทางการ/);
  // Sources: 37 linked domains and 4 sources named without a link (a fifth, oae, is also a domain). Documents: 41.
  await expect(page.locator(".source-list > li")).toHaveCount(41);
  const urls = await page.locator(".source-list ul a").evaluateAll((els) => els.map((el) => el.getAttribute("href")));
  expect(urls).toHaveLength(41);
  expect(new Set(urls).size).toBe(41);
});

test("a source shows its pages and its chapters; a chapter link lands on the source in that chapter", async ({ page }) => {
  await page.goto(ROUTE);
  const doa = page.locator("#src-doa");
  await expect(doa.locator(".source-pages")).toHaveText("หน้าในเอกสารต้นฉบับ: 1–4, 8, 12");
  await expect(doa.locator(".source-chapters a")).toHaveText(["บทที่ 1", "บทที่ 2", "บทที่ 5"]);
  // Shown by no chapter: listed, with no chapter link.
  await expect(page.locator("#src-irri .source-chapters")).toHaveCount(0);
  // Named in chapter 5's crop matcher, which has no list entry for it: the link is to the chapter.
  await expect(page.locator("#src-rice-dept")).toContainText("ไม่มีลิงก์");
  await expect(page.locator("#src-rice-dept .source-pages")).toHaveText("หน้าในเอกสารต้นฉบับ: 12");
  await expect(page.locator("#src-rice-dept .source-chapters a")).toHaveAttribute("href", "/th/ch05");
  await expect(page.locator("#src-uga")).toContainText("+2 แหล่งที่ไม่ได้ระบุชื่อ");
  await doa.getByRole("link", { name: "บทที่ 2" }).click();
  await expect(page).toHaveURL(/\/th\/ch02#src-doa$/);
  await expect(page.locator("#sources #src-doa")).toBeInViewport();
});

test("a Thai address reads as Thai, while its link is the document's own", async ({ page }) => {
  await page.goto(ROUTE);
  const link = page.locator("#src-oae ul a");
  expect(await link.getAttribute("href")).toMatch(/%E0%B8/);
  await expect(link).not.toContainText("%E0");
  // The English address before the Thai path is marked English; the Thai is not.
  await expect(link).not.toHaveAttribute("lang", "en");
  await expect(link.locator('span[lang="en"]')).toHaveText(/^coaching\.oae\.go\.th\//);
});

test("the soil-test strip closes the page, then the way back to the contents", async ({ page }) => {
  await page.goto(ROUTE);
  await expect(page.locator("article > .safe-strip")).toBeVisible();
  await expect(page.locator(".chapter-nav a")).toHaveAttribute("href", "/th");
});

test("chapter links are 44 px; nothing scrolls sideways from 1366 down to 320", async ({ page }) => {
  for (const width of [1366, 834, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(ROUTE);
    for (const a of await page.locator(".source-chapters a").all()) expect((await a.boundingBox())!.height, `${width}`).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${width}`).toBe(true);
  }
  await page.setViewportSize({ width: 1366, height: 900 });
  expect((await page.locator("article > section.chapter-card").first().boundingBox())!.width).toBeCloseTo(860, 0);
});
