import { expect, test } from "@playwright/test";
import { collectPageProblems } from "./console";

const ROUTE = "/th/ch01/deficiency";
const OLD_RULE = "ธาตุที่เคลื่อนที่ได้ในพืช (N, P, K, Mg) แสดงอาการที่ ใบแก่ ก่อน";
const YOUNG_RULE = "ธาตุที่เคลื่อนที่ไม่ได้ (Fe, Ca, B, S, Mn) แสดงอาการที่ ใบอ่อน/ยอด ก่อน";

test("the page has one h1 with the title, a back link to chapter 1 and a sources link, all 44 px", async ({ page }) => {
  const problems = collectPageProblems(page);
  await page.goto(ROUTE);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("อาการขาดธาตุ");
  const back = page.locator(".def-back");
  await expect(back).toHaveText("บทที่ 1");
  await expect(back).toHaveAttribute("href", "/th/ch01");
  const sources = page.locator(".def-bar-sources");
  await expect(sources).toHaveText("ที่มาของข้อมูล");
  for (const link of [back, sources]) expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await sources.click();
  await expect(page).toHaveURL(/#sources$/);
  expect(problems).toEqual([]);
});

test("old leaves are chosen on arrival: the badge, the group, the source's own sentence and its four chips", async ({ page }) => {
  await page.goto(ROUTE);
  const answer = page.locator(".def-answer");
  await expect(answer).toHaveAttribute("data-group", "old");
  await expect(answer.locator(".def-badge")).toHaveText("ใบแก่");
  await expect(answer.locator(".def-group-label")).toHaveText("ธาตุที่เคลื่อนที่ได้ในพืช");
  await expect(answer.locator(".def-answer-text")).toHaveText(OLD_RULE);
  await expect(answer.locator(".def-chip")).toHaveText(["N", "P", "K", "Mg"]);
  await expect(page.locator("[role=status]")).toHaveAttribute("aria-live", "polite");
});

test("each choice shows its own answer; the young leaves list five chips in the source's order and 'none' has none", async ({ page }) => {
  await page.goto(ROUTE);
  const group = page.getByRole("group", { name: "เลือกตำแหน่งใบ" });
  const answer = page.locator(".def-answer");
  await group.getByLabel("ใบอ่อน/ยอด", { exact: true }).check();
  await expect(answer).toHaveAttribute("data-group", "young");
  await expect(answer.locator(".def-answer-text")).toHaveText(YOUNG_RULE);
  await expect(answer.locator(".def-chip")).toHaveText(["Fe", "Ca", "B", "S", "Mn"]);
  await group.getByLabel("เอกสารไม่ระบุตำแหน่งใบ", { exact: true }).check();
  await expect(answer).toHaveAttribute("data-group", "unplaced");
  await expect(answer.locator(".def-badge")).toHaveText("ไม่ระบุ");
  await expect(answer.locator(".def-group-label")).toHaveText("ไม่มีข้อมูลอ้างอิง");
  await expect(answer.locator(".def-answer-text")).toHaveText("เอกสารไม่ได้ระบุว่าธาตุกลุ่มนี้แสดงอาการที่ใบแก่หรือใบอ่อนก่อน");
  await expect(answer.locator(".def-chip")).toHaveCount(0);
});

test("N, P and K chips carry the lesson's colours and the others are soil-brown", async ({ page }) => {
  await page.goto(ROUTE);
  const colour = (name: string) => page.locator(".def-chip", { hasText: new RegExp(`^${name}$`) }).evaluate((el) => getComputedStyle(el).backgroundColor);
  const [n, p, k, mg] = [await colour("N"), await colour("P"), await colour("K"), await colour("Mg")];
  expect(new Set([n, p, k, mg]).size).toBe(4);
  expect(n).toBe("rgb(47, 111, 62)");
  expect(p).toBe("rgb(132, 86, 176)");
  expect(k).toBe("rgb(181, 84, 30)");
  expect(mg).toBe("rgb(107, 74, 47)");
});

test("the picker is a radio group of 48 px choices", async ({ page }) => {
  await page.goto(ROUTE);
  const group = page.getByRole("group", { name: "เลือกตำแหน่งใบ" });
  for (const name of ["ใบแก่", "ใบอ่อน/ยอด", "เอกสารไม่ระบุตำแหน่งใบ"])
    expect((await group.getByRole("radio", { name }).locator("xpath=..").boundingBox())!.height).toBeGreaterThanOrEqual(48);
  // The flat plant following the choice (no WebGL) is in deficiency-scene.spec.ts.
});

test("the rules panel, the soil-test strip and the way on to the bag reader", async ({ page }) => {
  await page.goto(ROUTE);
  const rules = page.locator(".def-rules");
  await expect(rules.getByRole("heading", { level: 2, name: "กฎที่ใช้อ่านอาการ" })).toBeVisible();
  await expect(rules.locator('[data-group="old"] p').nth(1)).toHaveText("ธาตุที่เคลื่อนที่ได้ในพืช (N, P, K, Mg)");
  await expect(rules.locator('[data-group="young"] p').nth(1)).toHaveText("ธาตุที่เคลื่อนที่ไม่ได้ (Fe, Ca, B, S, Mn)");
  await expect(page.locator(".def-strip")).toHaveText("อัตราปุ๋ยที่แสดงบนเว็บไซต์เป็น จุดเริ่มต้น เท่านั้น แนะนำให้ ตรวจวิเคราะห์ดิน ก่อนใช้ปุ๋ยจริง");
  const next = page.locator(".def-next");
  await expect(next).toHaveText("ต่อไป วิธีอ่านตัวเลขบนกระสอบ");
  await expect(next).toHaveAttribute("href", "/th/ch03");
  expect((await next.boundingBox())!.height).toBeGreaterThanOrEqual(52);
  await next.click();
  await expect(page).toHaveURL(/\/th\/ch03$/);
});

test("the sources box names the one real source with its tier, its unnamed extras and its page", async ({ page }) => {
  await page.goto(ROUTE);
  const box = page.locator("section#sources");
  await expect(box.getByRole("heading", { level: 2, name: "ที่มาของข้อมูล" })).toBeVisible();
  await expect(box.locator("#src-uga")).toContainText("University of Georgia, CAES");
  await expect(box.locator('[data-tier="research"]')).toHaveCount(1);
  await expect(box).toContainText("+2 แหล่งที่ไม่ได้ระบุชื่อ");
  await expect(box).toContainText("หน้าในเอกสารต้นฉบับ: 2, 3");
  expect(await box.locator("a").count()).toBeGreaterThan(0);
});

test("two columns at 1366, one below, and no sideways scroll at any width", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto(ROUTE);
  const left = (await page.locator(".def-col-left").boundingBox())!;
  const right = (await page.locator(".def-col-right").boundingBox())!;
  expect(left.width).toBeLessThanOrEqual(826.5);
  expect(right.x).toBeGreaterThan(left.x + left.width);
  for (const width of [834, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${width}`).toBe(true);
  }
  await page.setViewportSize({ width: 834, height: 1100 });
  const stacked = (await page.locator(".def-col-right").boundingBox())!;
  expect(stacked.y).toBeGreaterThan(left.y + 100);
});

test("only chapter 1 has this page: another chapter or locale gets the not-found page and a noindex tag", async ({ request, page }) => {
  // Under cacheComponents the status is 200 before notFound() runs (see shell.spec.ts), so the guarantee is the
  // not-found page plus noindex, and that none of this page's words are served.
  for (const path of ["/th/ch02/deficiency", "/th/ch99/deficiency", "/km/ch01/deficiency"]) {
    const html = await (await request.get(path)).text();
    expect(html, path).toMatch(/<meta name="robots" content="noindex"/);
    expect(html, path).not.toContain("กฎที่ใช้อ่านอาการ");
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).not.toHaveText("อาการขาดธาตุ");
  }
});
