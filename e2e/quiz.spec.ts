import { expect, test, type Locator, type Page } from "@playwright/test";
import { collectPageProblems } from "./console";

const ROUTE = "/th/ch07";
const KEY = "fertilizer-quiz-v1";
const QA = [
  ["46-0-0 มีธาตุอะไร?", "N อย่างเดียว"],
  ["ใบแก่เหลืองทั้งใบแสดงว่าขาดธาตุอะไร?", "N"],
  ["ใบอ่อนเหลืองแต่เส้นใบเขียวแสดงว่าขาดธาตุอะไร?", "Fe"],
  ["ปุ๋ย 16-20-0 หนัก 50 กก. มี N กี่กิโลกรัม?", "8 กก."],
  ["พืชที่ไวต่อคลอไรด์ควรใช้ปุ๋ยโพแทสเซียมชนิดใด?", "K₂SO₄"],
  ["ปูนมาร์ลเป็นปุ๋ยหรือไม่?", "ไม่ใช่ เป็นสารปรับปรุงดิน"],
] as const;

const item = (page: Page, i: number) => page.locator(`.quiz-item[data-question="${i}"]`);
const score = (page: Page) => page.locator(".quiz-score");
/** Which question the card shows: one at a time since T-053. */
const showing = (page: Page) => page.locator(".quiz-item:not([hidden])").getAttribute("data-question").then(Number);

async function open(page: Page) {
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  await expect(page.locator(".quiz-item")).toHaveCount(6);
}
/** Bring question i into the card with the next button (it wraps round), as a reader would at any width. */
async function goTo(page: Page, i: number) {
  for (let n = 0; n < 6 && (await showing(page)) !== i; n++) await press(page.getByRole("button", { name: "ข้อถัดไป" }));
  await expect(item(page, i)).toBeVisible();
}
/** A finger on iPad, a click on Mac. */
async function press(target: Locator) {
  if (test.info().project.use.hasTouch) await target.tap();
  else await target.click();
}
async function answer(page: Page, i: number, mark: "ตอบถูก" | "ยังไม่ถูก") {
  await goTo(page, i);
  const it = item(page, i);
  if (await it.locator(".quiz-answer").isHidden()) await press(it.getByRole("button", { name: "ดูคำตอบ" }));
  await press(it.getByRole("button", { name: mark, exact: true }));
}
const saved = (page: Page) => page.evaluate((k) => window.localStorage.getItem(k), KEY);

test("shows the six questions word for word, one at a time from the first, every answer closed", async ({ page }) => {
  const problems = collectPageProblems(page);
  await open(page);
  expect(await showing(page)).toBe(0);
  await expect(page.locator(".quiz-item:visible")).toHaveCount(1);
  for (const [i, [q]] of QA.entries()) {
    await goTo(page, i);
    await expect(item(page, i).locator(".quiz-q")).toHaveText(q);
    await expect(item(page, i).locator(".quiz-answer")).toBeHidden();
    await expect(item(page, i).getByRole("button", { name: "ดูคำตอบ" })).toHaveAttribute("aria-expanded", "false");
  }
  await expect(score(page)).toHaveText("ทำเครื่องหมายว่าตอบถูก 0 จาก 6");
  expect(problems).toEqual([]);
});

test("each answer is the pamphlet's, shown on request and hidden again on request", async ({ page }) => {
  await open(page);
  for (const [i, [, a]] of QA.entries()) {
    await goTo(page, i);
    const it = item(page, i);
    await press(it.getByRole("button", { name: "ดูคำตอบ" }));
    await expect(it.locator(".quiz-a")).toHaveText(a);
    await expect(it.locator(".quiz-answer")).toBeVisible();
    await press(it.getByRole("button", { name: "ซ่อนคำตอบ" }));
    await expect(it.locator(".quiz-answer")).toBeHidden();
  }
});

test("marking updates the score, which is a polite live region, and a mark can be taken back", async ({ page }) => {
  await open(page);
  await expect(score(page)).toHaveAttribute("aria-live", "polite");
  await expect(score(page)).toHaveAttribute("role", "status");
  await answer(page, 0, "ตอบถูก");
  await answer(page, 3, "ตอบถูก");
  await answer(page, 4, "ยังไม่ถูก");
  // A "not yet" mark changes the line too, so VoiceOver announces it.
  await expect(score(page)).toHaveText("ทำเครื่องหมายว่าตอบถูก 2 จาก 6 · ยังไม่ถูก 1");
  await expect(item(page, 4).getByRole("button", { name: "ยังไม่ถูก", exact: true })).toHaveAttribute("aria-pressed", "true");
  await goTo(page, 0);
  await expect(item(page, 0).getByRole("button", { name: "ตอบถูก", exact: true })).toHaveAttribute("aria-pressed", "true");
  await press(item(page, 0).getByRole("button", { name: "ตอบถูก", exact: true }));
  await expect(score(page)).toHaveText("ทำเครื่องหมายว่าตอบถูก 1 จาก 6 · ยังไม่ถูก 1");
  await expect(item(page, 0)).toHaveAttribute("data-mark", "none");
});

test("progress survives a reload, with the answers closed again, and nothing leaves the device", async ({ page }) => {
  const requests: string[] = [];
  const problems = collectPageProblems(page);
  await open(page);
  const origin = new URL(page.url()).origin;
  const methods = new Set<string>();
  page.on("request", (r) => {
    requests.push(`${r.resourceType()} ${r.url()}`);
    methods.add(r.method());
  });
  await answer(page, 1, "ตอบถูก");
  await answer(page, 2, "ยังไม่ถูก");
  await answer(page, 5, "ตอบถูก");
  expect(JSON.parse((await saved(page))!)).toEqual({ v: 1, marks: [null, "right", "again", null, null, "right"] });
  // Marking must not talk to any server. (Next's own link prefetches, ?_rsc=, are the only fetches a page makes unprompted.)
  expect(requests.filter((r) => /^(fetch|xhr|websocket|ping|other) /.test(r) && !r.includes("?_rsc="))).toEqual([]);
  expect([...methods]).toEqual(["GET"].filter((m) => methods.has(m)));
  expect(requests.every((r) => r.split(" ")[1]!.startsWith(origin + "/") || r.includes("data:"))).toBe(true);

  await page.reload({ waitUntil: "networkidle" });
  await expect(score(page)).toHaveText("ทำเครื่องหมายว่าตอบถูก 2 จาก 6 · ยังไม่ถูก 1");
  await expect(item(page, 1)).toHaveAttribute("data-mark", "right");
  await expect(item(page, 2)).toHaveAttribute("data-mark", "again");
  await expect(item(page, 5)).toHaveAttribute("data-mark", "right");
  await expect(item(page, 0)).toHaveAttribute("data-mark", "none");
  await expect(item(page, 1).locator(".quiz-answer")).toBeHidden();
  expect(problems, "no hydration or console error with saved progress").toEqual([]);

  // Cookies: the quiz sets none.
  expect(await page.context().cookies()).toEqual([]);
});

test("the mark shows as text beside a closed question, in the right numbered order, with the group named by its question", async ({ page }) => {
  await open(page);
  await answer(page, 3, "ตอบถูก");
  await press(item(page, 3).getByRole("button", { name: "ซ่อนคำตอบ" }));
  await expect(item(page, 3).locator(".quiz-q")).toHaveText("ปุ๋ย 16-20-0 หนัก 50 กก. มี N กี่กิโลกรัม? · ตอบถูก");
  // The numbers 1–6 the source prints are drawn on each card (T-053: one card at a time, no list markers).
  await expect(item(page, 3).locator(".quiz-num")).toHaveText("4");
  // The marks group is named by "check your own answer" and its question.
  const ids = (await item(page, 3).locator(".quiz-marks").getAttribute("aria-labelledby"))!.split(" ");
  await expect(page.locator(`[id="${ids[0]}"]`)).toHaveText("ตรวจคำตอบของคุณเอง");
  await expect(page.locator(`[id="${ids[1]}"]`)).toContainText("ปุ๋ย 16-20-0");
  await goTo(page, 1);
  // Latin-only answers are read in English.
  await expect(item(page, 1).locator(".quiz-a")).toHaveAttribute("lang", "en");
  await expect(item(page, 0).locator(".quiz-a")).not.toHaveAttribute("lang", /.+/);
});

test("reset clears the marks and the saved copy", async ({ page }) => {
  await open(page);
  await answer(page, 0, "ตอบถูก");
  await press(page.getByRole("button", { name: "เริ่มใหม่" }));
  await expect(score(page)).toHaveText("ทำเครื่องหมายว่าตอบถูก 0 จาก 6");
  expect(JSON.parse((await saved(page))!)).toEqual({ v: 1, marks: [null, null, null, null, null, null] });
  await page.reload({ waitUntil: "networkidle" });
  await expect(score(page)).toHaveText("ทำเครื่องหมายว่าตอบถูก 0 จาก 6");
});

const BLOCKED = {
  "storage throws on every access": () => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("denied", "SecurityError");
      },
    });
  },
  "reads work but writes throw (full or private)": () => {
    Storage.prototype.setItem = () => {
      throw new DOMException("full", "QuotaExceededError");
    };
    Storage.prototype.removeItem = () => {
      throw new DOMException("full", "QuotaExceededError");
    };
  },
  "storage is missing entirely": () => {
    Object.defineProperty(window, "localStorage", { value: undefined });
  },
};
for (const [name, block] of Object.entries(BLOCKED)) {
  test(`with blocked storage (${name}) the quiz still works for the visit, and does not crash`, async ({ page }) => {
    const problems = collectPageProblems(page);
    await page.addInitScript(block);
    await open(page);
    await answer(page, 0, "ตอบถูก");
    await answer(page, 3, "ตอบถูก");
    await expect(score(page)).toHaveText("ทำเครื่องหมายว่าตอบถูก 2 จาก 6");
    await press(page.getByRole("button", { name: "เริ่มใหม่" }));
    await expect(score(page)).toHaveText("ทำเครื่องหมายว่าตอบถูก 0 จาก 6");
    await answer(page, 5, "ตอบถูก");
    await expect(score(page)).toHaveText("ทำเครื่องหมายว่าตอบถูก 1 จาก 6");
    // Without storage nothing can persist: a reload starts clean, and still without error.
    await page.reload({ waitUntil: "networkidle" });
    await expect(score(page)).toHaveText("ทำเครื่องหมายว่าตอบถูก 0 จาก 6");
    expect(problems).toEqual([]);
  });
}

for (const [name, value] of Object.entries({
  "not JSON": "{oops",
  "another version": '{"v":9,"marks":["right","right","right","right","right","right"]}',
  "wrong length": '{"v":1,"marks":["right"]}',
})) {
  test(`a corrupt saved value (${name}) is ignored: the quiz starts fresh and works`, async ({ page }) => {
    const problems = collectPageProblems(page);
    await page.addInitScript(([k, v]) => window.localStorage.setItem(k!, v!), [KEY, value]);
    await open(page);
    await expect(score(page)).toHaveText("ทำเครื่องหมายว่าตอบถูก 0 จาก 6");
    await answer(page, 0, "ตอบถูก");
    await expect(score(page)).toHaveText("ทำเครื่องหมายว่าตอบถูก 1 จาก 6");
    expect(problems).toEqual([]);
  });
}

test("keyboard: the answer opens and a mark is set from the keyboard", async ({ page }) => {
  await open(page);
  await goTo(page, 2);
  const it = item(page, 2);
  await it.getByRole("button", { name: "ดูคำตอบ" }).focus();
  await page.keyboard.press("Enter");
  await expect(it.locator(".quiz-a")).toBeVisible();
  const right = it.getByRole("button", { name: "ตอบถูก", exact: true });
  await right.focus();
  await page.keyboard.press("Space");
  await expect(right).toHaveAttribute("aria-pressed", "true");
  await expect(score(page)).toHaveText("ทำเครื่องหมายว่าตอบถูก 1 จาก 6");
});

test("every button is at least 44 x 44, and the toggle names what it controls", async ({ page }) => {
  await open(page);
  await press(item(page, 0).getByRole("button", { name: "ดูคำตอบ" }));
  await expect(item(page, 0).locator(".quiz-answer")).toBeVisible();
  for (const button of await page.locator(".quiz button:visible").all()) {
    const box = (await button.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
  const toggle = item(page, 0).getByRole("button", { name: "ซ่อนคำตอบ" });
  const controls = await toggle.getAttribute("aria-controls");
  expect(await page.locator(`#${controls}`).count()).toBe(1);
});

test("the questions are in the server HTML; the page does not scroll sideways", async ({ page, request }) => {
  const html = await (await request.get(ROUTE)).text();
  for (const [q] of QA) expect(html).toContain(q);
  await open(page);
  const [sw, cw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(sw).toBeLessThanOrEqual(cw);
});
