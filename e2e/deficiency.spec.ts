import { expect, test, type Page } from "@playwright/test";
import { collectPageProblems } from "./console";

const ROUTE = "/th/ch01";

/** The pamphlet's p3 table, by row id: [elements, symptom]. */
const ROWS: Record<string, [string, string]> = {
  n: ["N", "ใบแก่เหลืองซีดทั้งใบ ต้นแคระ"],
  p: ["P", "ใบเขียวเข้มอมม่วง โตช้า"],
  k: ["K", "ขอบและปลายใบแก่เหลืองแล้วไหม้ ผลเล็ก"],
  mg: ["Mg", "ใบแก่เหลืองระหว่างเส้นใบ"],
  s: ["S", "ใบอ่อนเหลืองทั้งใบ"],
  ca: ["Ca", "ยอดตาย ผลเน่าที่ก้น"],
  "fe-mn": ["Fe / Mn", "ใบอ่อนเหลือง เส้นใบเขียวเป็นร่างแห"],
  zn: ["Zn", "ใบเล็ก ข้อสั้น ยอดเป็นกระจุก"],
  b: ["B", "ยอดบิด ดอกร่วง ติดผลน้อย"],
  "cu-mo": ["Cu / Mo", "ใบอ่อนซีดเหี่ยว (Cu); ใบแก่เหลือง พืชตระกูลถั่ว/กะหล่ำไวต่อการขาด (Mo)"],
};
const GROUPS = {
  ใบแก่: { rows: ["n", "p", "k", "mg"], rule: "ธาตุที่เคลื่อนที่ได้ในพืช (N, P, K, Mg) แสดงอาการที่ ใบแก่ ก่อน" },
  "ใบอ่อน/ยอด": {
    rows: ["s", "ca", "fe-mn", "b"],
    rule: "ธาตุที่เคลื่อนที่ไม่ได้ (Fe, Ca, B, S, Mn) แสดงอาการที่ ใบอ่อน/ยอด ก่อน",
  },
  เอกสารไม่ระบุตำแหน่งใบ: {
    rows: ["zn", "cu-mo"],
    rule: "เอกสารไม่ได้ระบุว่าธาตุกลุ่มนี้แสดงอาการที่ใบแก่หรือใบอ่อนก่อน",
  },
} as const;

const canvas = (page: Page) => page.locator(".scene3d canvas:visible");

async function open(page: Page) {
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  const group = page.getByRole("group", { name: "เลือกตำแหน่งใบ", exact: true });
  // The plant loads when it is about to be seen, so bring it into view like a reader would.
  await group.scrollIntoViewIfNeeded();
  await expect(group).toBeVisible();
  return group;
}

/** Where a tap target sits, in page coordinates, as the scene reports it. */
async function region(page: Page, which: "old" | "young") {
  // The chapter is long: bring the plant into view first, or a mouse click lands off-screen.
  await canvas(page).evaluate((el) => el.scrollIntoView({ block: "center" }));
  const box = (await canvas(page).boundingBox())!;
  const attr = await canvas(page).getAttribute(which === "old" ? "data-region-old" : "data-region-young");
  const [x, y, w, h] = attr!.split(",").map(Number) as [number, number, number, number];
  return { x: box.x + x, y: box.y + y, w, h, cx: box.x + x + w / 2, cy: box.y + y + h / 2 };
}

async function selectedLeaf(page: Page) {
  return page.locator(".def-option input:checked").evaluate((el) => (el as HTMLInputElement).value);
}

test("each choice shows exactly its own p3 rows, verbatim, and the source's rule", async ({ page }) => {
  const problems = collectPageProblems(page);
  const group = await open(page);
  const seen = new Set<string>();
  for (const [name, expected] of Object.entries(GROUPS)) {
    await group.getByLabel(name, { exact: true }).check();
    const panel = page.locator(".def-panel .panel");
    await expect(panel.locator(".def-rule")).toHaveText(expected.rule);
    await expect(panel.locator("[data-row]")).toHaveCount(expected.rows.length);
    for (const id of expected.rows) {
      const row = panel.locator(`[data-row="${id}"]`);
      await expect(row.locator("dt")).toHaveText(ROWS[id]![0]);
      await expect(row.locator("dd")).toHaveText(ROWS[id]![1]);
      seen.add(id);
    }
  }
  expect([...seen].sort(), "all 10 rows reachable").toEqual(Object.keys(ROWS).sort());
  expect(problems).toEqual([]);
});

test("the old-leaf choice is already shown on arrival, and the panel announces changes politely", async ({ page }) => {
  await open(page);
  expect(await selectedLeaf(page)).toBe("old");
  await expect(page.locator(".def-panel .panel [data-row]")).toHaveCount(4);
  const panel = page.locator(".def-panel");
  await expect(panel).toHaveAttribute("role", "status");
  await expect(panel).toHaveAttribute("aria-live", "polite");
  await expect(panel).toHaveAttribute("aria-atomic", "true");
});

test("the text table has all 10 rows and is in the server HTML, before any script runs", async ({ request }) => {
  const html = await (await request.get(ROUTE)).text();
  for (const id of Object.keys(ROWS)) expect(html, id).toContain(`data-row="${id}" data-source-page="3"`);
  expect(html).toContain('type="radio"');
  expect(html).toContain("ใบเขียวเข้มอมม่วง โตช้า");
});

test("the table is a real table whose rows read element then symptom", async ({ page }) => {
  await open(page);
  const table = page.locator("table", { has: page.locator('[data-row="zn"]') });
  await expect(table.locator("tbody tr")).toHaveCount(10);
  await expect(table.getByRole("columnheader")).toHaveText(["ธาตุ", "อาการ"]);
  await expect(table.getByRole("rowheader")).toHaveCount(10);
});

test("tapping the old leaves, then the young leaves, in the 3D plant changes the choice", async ({ page }) => {
  const group = await open(page);
  await expect(canvas(page)).toHaveAttribute("data-region-young", /.+/);

  await group.getByLabel("ใบอ่อน/ยอด", { exact: true }).check();
  const old = await region(page, "old");
  await page.mouse.click(old.cx, old.cy);
  await expect.poll(() => selectedLeaf(page)).toBe("old");
  await expect(page.locator(".def-panel [data-row]")).toHaveCount(4);

  const young = await region(page, "young");
  await page.mouse.click(young.cx, young.cy);
  await expect.poll(() => selectedLeaf(page)).toBe("young");
  await expect(page.locator('.def-panel [data-row="ca"] dd')).toHaveText(ROWS.ca![1]);
});

test("a real finger tap works too", async ({ page }) => {
  test.skip(!test.info().project.use.hasTouch, "needs a touch device");
  const group = await open(page);
  await expect(canvas(page)).toHaveAttribute("data-region-young", /.+/);
  await group.getByLabel("ใบอ่อน/ยอด", { exact: true }).check();
  const old = await region(page, "old");
  await page.touchscreen.tap(old.cx, old.cy);
  await expect.poll(() => selectedLeaf(page)).toBe("old");
});

test("both leaf regions are at least 44 x 44 CSS px, even fully zoomed out", async ({ page }) => {
  await open(page);
  await expect(canvas(page)).toHaveAttribute("data-region-young", /.+/);
  const zoomOut = () =>
    canvas(page).evaluate((el) => el.dispatchEvent(new WheelEvent("wheel", { deltaY: 2000, ctrlKey: true, cancelable: true })));
  for (const step of ["start", "far"]) {
    if (step === "far") await zoomOut();
    await expect.poll(async () => Number(await canvas(page).getAttribute("data-zoom"))).toBeGreaterThan(step === "far" ? 6.9 : 3.9);
    for (const which of ["old", "young"] as const) {
      const r = await region(page, which);
      expect(r.w, `${which} width at ${step}`).toBeGreaterThanOrEqual(44);
      expect(r.h, `${which} height at ${step}`).toBeGreaterThanOrEqual(44);
    }
  }
});

test("dragging rotates the plant and never counts as a tap", async ({ page }) => {
  const group = await open(page);
  await expect(canvas(page)).toHaveAttribute("data-region-old", /.+/);
  await group.getByLabel("ใบอ่อน/ยอด", { exact: true }).check();
  // Hold still first (reduced motion would make this exact; otherwise idle spin is also running).
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(300);
  const before = Number(await canvas(page).getAttribute("data-yaw"));
  const old = await region(page, "old");
  await page.mouse.move(old.cx, old.cy);
  await page.mouse.down();
  await page.mouse.move(old.cx + 80, old.cy, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => Number(await canvas(page).getAttribute("data-yaw"))).toBeGreaterThan(before + 0.5);
  expect(await selectedLeaf(page), "a drag that starts on the old leaves must not select them").toBe("young");
});

test("Ctrl + scroll (a trackpad pinch) zooms; plain scroll is left to the page", async ({ page }) => {
  await open(page);
  await expect(canvas(page)).toHaveAttribute("data-zoom", /.+/);
  const zoom = async () => Number(await canvas(page).getAttribute("data-zoom"));
  const start = await zoom();
  const wheel = (init: { deltaY: number; ctrlKey?: boolean }) =>
    canvas(page).evaluate((el, i: { deltaY: number; ctrlKey?: boolean }) => {
      const e = new WheelEvent("wheel", { deltaY: i.deltaY, ctrlKey: Boolean(i.ctrlKey), cancelable: true });
      el.dispatchEvent(e);
      return e.defaultPrevented;
    }, init);

  expect(await wheel({ deltaY: 100 }), "plain scroll is not swallowed").toBe(false);
  await page.waitForTimeout(200);
  expect(await zoom()).toBeCloseTo(start, 1);

  expect(await wheel({ deltaY: -60, ctrlKey: true })).toBe(true);
  await expect.poll(zoom).toBeLessThan(start - 0.5);
});

test("the plant never scrolls-traps a vertical swipe: the box allows vertical panning", async ({ page }) => {
  await open(page);
  await expect(page.locator(".scene3d:has(canvas)")).toHaveCSS("touch-action", "pan-y");
});

test("idle spin stops under prefers-reduced-motion", async ({ page }) => {
  await open(page);
  await expect(canvas(page)).toHaveAttribute("data-yaw", /.+/);
  const yaw = async () => await canvas(page).getAttribute("data-yaw");
  const a = await yaw();
  await page.waitForTimeout(600);
  expect(await yaw(), "spins by default").not.toBe(a);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(300);
  const b = await yaw();
  await page.waitForTimeout(600);
  expect(await yaw()).toBe(b);

  // Any redraw (here, a new choice) must not smuggle a spin step in: the on-demand loop reports a long delta.
  await page.getByLabel("ใบอ่อน/ยอด", { exact: true }).check();
  await page.waitForTimeout(500);
  expect(await yaw(), "a redraw does not spin the plant").toBe(b);
});

test("without WebGL the choice, the panel and the table all still work, and a note says why", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (/webgl/.test(type)) return null;
      return (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof original;
  });
  const group = await open(page);
  await expect(page.locator(".scene3d-fallback")).toHaveText("เครื่องนี้แสดงภาพสามมิติไม่ได้ ใช้ตัวเลือกด้านบนและตารางด้านล่างแทน");
  await expect(page.locator("canvas")).toHaveCount(0);
  // The artboard's flat plant stands in for the 3D one (T-032) and follows the choice.
  const flat = page.getByRole("img", { name: "ภาพต้นพืช แสดงตำแหน่งใบแก่ด้านล่างและใบอ่อนหรือยอดด้านบน" });
  await expect(flat).toBeVisible();
  await expect(flat).toHaveAttribute("data-leaf", "old");
  await group.getByLabel("ใบอ่อน/ยอด", { exact: true }).check();
  await expect(flat).toHaveAttribute("data-leaf", "young");
  await expect(page.locator('.def-panel [data-row="b"] dd')).toHaveText(ROWS.b![1]);
  await expect(page.locator("table tbody tr")).not.toHaveCount(0);
});

test("chapter 1 holds one WebGL context while open, none after leaving, and one again on return", async ({ page }) => {
  await page.addInitScript(() => {
    const made: WebGLRenderingContext[] = [];
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      const ctx = (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
      if (ctx && /webgl/.test(type) && !made.includes(ctx as WebGLRenderingContext)) made.push(ctx as WebGLRenderingContext);
      return ctx;
    } as typeof original;
    (window as unknown as { __made: WebGLRenderingContext[] }).__made = made;
  });
  const alive = () =>
    page.evaluate(() => (window as unknown as { __made: WebGLRenderingContext[] }).__made.filter((g) => !g.isContextLost()).length);
  await open(page);
  await expect(canvas(page)).toBeVisible();
  // R3F puts the <canvas> in the page a moment before it creates the context, so wait for it rather than
  // reading the count at once (that read lost the race 7 of 8 times at iPad portrait).
  await expect.poll(alive).toBe(1);
  await page.getByRole("link", { name: /บทถัดไป/ }).click();
  await expect(page).toHaveURL(/ch02$/);
  await expect.poll(alive, "released once the route is hidden").toBe(0);
  await page.goBack();
  await expect(canvas(page)).toBeVisible();
  await expect.poll(alive).toBe(1);
});

test("three.js is not fetched until the plant is near the screen, and is fetched when it is", async ({ page }) => {
  const scripts: string[] = [];
  page.on("response", (r) => {
    if (/\.js(\?|$)/.test(r.url())) scripts.push(r.url());
  });
  // A short phone-shaped window, so the plant (about 1,100 px down) starts below the fold on every project.
  await page.setViewportSize({ width: 412, height: 700 });
  const bodies = () => page.evaluate(async (urls) => (await Promise.all(urls.map((u) => fetch(u).then((r) => r.text())))).some((t) => t.includes("WebGLRenderer")), scripts);
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  await expect(page.locator(".deficiency .scene3d")).toHaveCount(1); // the placeholder holds the space
  await expect(page.locator("canvas")).toHaveCount(0);
  expect(await bodies(), "no three.js on arrival").toBe(false);
  const before = scripts.length;
  await page.locator(".deficiency").scrollIntoViewIfNeeded();
  await expect(page.locator(".scene3d canvas:visible")).toBeVisible();
  expect(scripts.length, "scrolling to the plant fetches the 3D chunk").toBeGreaterThan(before);
  expect(await bodies(), "three.js after scrolling").toBe(true);
});

test("the radios and the table work before the plant has loaded", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 700 });
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByLabel("ใบอ่อน/ยอด", { exact: true }).check({ force: true });
  await expect(page.locator('.def-panel [data-row="ca"] dd')).toHaveText(ROWS.ca![1]);
});
