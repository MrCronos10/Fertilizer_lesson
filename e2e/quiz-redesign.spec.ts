import { expect, test, type Page } from "@playwright/test";

/** Chapter 7's quiz laid out as the Quiz artboards draw it (T-053); its behaviour is e2e/quiz.spec.ts. */
const ROUTE = "/th/ch07";
const showing = (page: Page) => page.locator(".quiz-item:not([hidden])");
const next = (page: Page) => page.getByRole("button", { name: "ข้อถัดไป" });
const prev = (page: Page) => page.getByRole("button", { name: "ข้อก่อนหน้า" });

test("previous and next move one question, wrap round at both ends, and the move is announced", async ({ page }) => {
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  const progress = page.locator(".quiz-progress");
  await expect(progress).toHaveAttribute("role", "status");
  await expect(progress).toHaveAttribute("aria-live", "polite");
  await expect(progress).toHaveAttribute("aria-atomic", "true");
  // Out of sight in landscape, but still in the accessibility tree: not display:none or visibility:hidden.
  await page.setViewportSize({ width: 1366, height: 1024 });
  expect(await progress.evaluate((el) => [getComputedStyle(el).display, getComputedStyle(el).visibility].join())).toBe("block,visible");
  await expect(progress).toHaveText("ข้อ 1 จาก 6");
  await prev(page).click();
  await expect(showing(page)).toHaveAttribute("data-question", "5");
  await expect(progress).toHaveText("ข้อ 6 จาก 6");
  await next(page).click();
  await expect(showing(page)).toHaveAttribute("data-question", "0");
  await next(page).click();
  await expect(showing(page)).toHaveAttribute("data-question", "1");
});

test("landscape: the 820 px card beside the panel of all six, each row a button that brings its question up", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 1024 });
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  const card = (await showing(page).boundingBox())!;
  expect(card.width).toBeCloseTo(820, 0);
  expect(card.height).toBeGreaterThanOrEqual(452);
  await expect(page.locator(".quiz-total")).toHaveText("ทั้งหมด 6 ข้อ");
  await expect(page.locator(".quiz-dots")).toBeHidden();
  const rows = page.locator(".quiz-row");
  await expect(rows).toHaveCount(6);
  expect((await rows.first().boundingBox())!.x).toBeGreaterThan(card.x + card.width + 30);
  await expect(rows.nth(0)).toHaveAttribute("aria-current", "step");
  await rows.nth(4).click();
  await expect(showing(page)).toHaveAttribute("data-question", "4");
  await expect(rows.nth(4)).toHaveAttribute("aria-current", "step");
  await expect(rows.nth(0)).not.toHaveAttribute("aria-current", /.+/);
  for (const r of await rows.all()) expect((await r.boundingBox())!.height).toBeGreaterThanOrEqual(52);
});

test("a mark shows in the question's row and dot: its status word and its colour", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 1024 });
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  await expect(page.locator(".quiz-row-status").first()).toHaveText("ยังไม่ตรวจ");
  await showing(page).getByRole("button", { name: "ดูคำตอบ" }).click();
  await showing(page).getByRole("button", { name: "ยังไม่ถูก", exact: true }).click();
  await expect(page.locator(".quiz-row").first()).toHaveAttribute("data-mark", "again");
  await expect(page.locator(".quiz-row-status").first()).toHaveText("ยังไม่ถูก");
  await page.setViewportSize({ width: 834, height: 1194 });
  await expect(page.locator(".quiz-dots span").first()).toHaveAttribute("data-mark", "again");
  expect(await page.locator(".quiz-dots span").first().evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgb(181, 84, 30)");
});

test("portrait: dots over the card, the current one ringed, no panel; the notes side by side", async ({ page }) => {
  await page.setViewportSize({ width: 834, height: 1194 });
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  await expect(page.locator(".quiz-rows")).toBeHidden();
  await expect(page.locator(".quiz-progress")).toBeVisible();
  const dots = page.locator(".quiz-dots span");
  await expect(dots).toHaveCount(6);
  await expect(dots.first()).toHaveAttribute("data-current", "");
  expect((await page.locator(".quiz-dots").boundingBox())!.y).toBeLessThan((await showing(page).boundingBox())!.y);
  const device = (await page.locator(".quiz-device").boundingBox())!;
  const source = (await page.locator(".quiz-source").boundingBox())!;
  expect(source.width).toBeCloseTo(282, 0);
  expect(source.y).toBeCloseTo(device.y, 0);
});

test("the notes say progress stays on this device and the questions are the source's own", async ({ page }) => {
  await page.goto(ROUTE);
  await expect(page.locator(".quiz-device")).toHaveText("ความคืบหน้าของแบบทดสอบถูกเก็บไว้ในเครื่องของคุณเท่านั้น ไม่ต้องสมัครสมาชิก");
  await expect(page.locator(".quiz-source")).toHaveText("คำถามทั้ง 6 ข้อมาจากเอกสารต้นฉบับโดยตรง ไม่มีการเขียนคำถามใหม่");
});

test("phone: one column, every control at least 44 px, nothing scrolls sideways down to 320", async ({ page }) => {
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(ROUTE, { waitUntil: "networkidle" });
    await showing(page).getByRole("button", { name: "ดูคำตอบ" }).click();
    for (const b of await page.locator(".quiz button:visible").all()) {
      const box = (await b.boundingBox())!;
      expect(box.height, `${width}`).toBeGreaterThanOrEqual(44);
      expect(box.width, `${width}`).toBeGreaterThanOrEqual(44);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${width}`).toBe(true);
  }
});
