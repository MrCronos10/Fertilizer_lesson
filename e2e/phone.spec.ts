import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { collectPageProblems } from "./console";
import { ROUTES } from "../lib/budget";

/**
 * T-026: phones are not a v1 target (PRD section 4), but "must not break" still holds: no page scrolls
 * sideways at 390 px, every table stays readable, and a 3D scene either works or shows its fallback,
 * never a broken canvas. Run once, in a 390 x 844 window with touch, whatever project it is listed under.
 */
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 3 });
test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "mac-desktop", "one phone-sized run is enough; it sets its own viewport");
});

async function open(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle" });
}

for (const route of ROUTES) {
  test(`${route.path}: no sideways page scroll at 390 px, no console error, and a picture is taken`, async ({ page }, info) => {
    const problems = collectPageProblems(page);
    await open(page, route.path);
    if (route.path === "/th/ch01") await page.locator(".deficiency").scrollIntoViewIfNeeded();
    const [sw, cw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    expect(sw, `${route.path} is ${sw}px wide in a ${cw}px window`).toBeLessThanOrEqual(cw);
    // Nothing visible sticks out past the right edge, apart from the inside of a table's own scroll box.
    const out = await page.evaluate(() =>
      [...document.body.querySelectorAll<HTMLElement>("*")]
        .filter((el) => !el.closest(".table-figure") && !el.closest("svg") && !el.closest("[hidden]") && !el.classList.contains("visually-hidden"))
        .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.right > document.documentElement.clientWidth + 1; })
        .map((el) => `${el.tagName.toLowerCase()}.${el.className}`.slice(0, 60)),
    );
    expect(out).toEqual([]);
    mkdirSync("test-results/phone", { recursive: true });
    const file = `test-results/phone/${route.path.replace(/\//g, "_") || "_"}.png`;
    await page.screenshot({ path: file, fullPage: true, scale: "css" });
    await info.attach(`390x844 ${route.path}`, { path: file, contentType: "image/png" });
    expect(problems).toEqual([]);
  });
}

test("every table is readable on a phone: it scrolls inside its own box, its columns are not squeezed, its text is not tiny", async ({ page }) => {
  const bad: string[] = [];
  for (const path of ["/th/ch01", "/th/ch02"]) {
    await open(page, path);
    const tables = await page.locator("figure.table-figure").evaluateAll((figs) =>
      figs.map((fig) => {
        const table = fig.querySelector("table")!;
        // The first column is a short name or symbol (Fe / Mn, 16-20-0); every other column holds sentences.
        const rows = [...table.querySelectorAll("tbody tr")];
        const firstCol = Math.min(...rows.map((r) => r.children[0]!.getBoundingClientRect().width));
        const prose = Math.min(...rows.flatMap((r) => [...r.children].slice(1).map((c) => c.getBoundingClientRect().width)));
        const fontPx = parseFloat(getComputedStyle(table.querySelector("td")!).fontSize);
        return {
          label: fig.getAttribute("aria-label"),
          scrolls: fig.scrollWidth > fig.clientWidth,
          focusable: (fig as HTMLElement).tabIndex === 0,
          figureFits: fig.getBoundingClientRect().right <= document.documentElement.clientWidth + 1,
          firstCol,
          prose,
          cols: Number(table.getAttribute("data-cols")),
          fontPx,
        };
      }),
    );
    expect(tables.length).toBeGreaterThan(0);
    for (const t of tables) {
      if (t.scrolls && !t.focusable) bad.push(`${path} ${t.label}: scrolls but a keyboard cannot reach it`);
      if (!t.figureFits) bad.push(`${path} ${t.label}: the box itself pokes out of the screen`);
      if (t.firstCol < 44) bad.push(`${path} ${t.label}: the first column is only ${Math.round(t.firstCol)}px wide`);
      if (t.cols >= 3 && t.prose < 100) bad.push(`${path} ${t.label}: a text column is only ${Math.round(t.prose)}px wide`);
      if (t.fontPx < 14) bad.push(`${path} ${t.label}: text is ${t.fontPx}px`);
    }
  }
  expect(bad).toEqual([]);
});

test("a wide table keeps its first column in view while it scrolls sideways", async ({ page }) => {
  await open(page, "/th/ch02");
  const fig = page.locator("figure.table-figure", { has: page.locator('[data-row="urea"]') });
  await fig.scrollIntoViewIfNeeded();
  await expect.poll(() => fig.evaluate((f) => f.scrollWidth > f.clientWidth)).toBe(true);
  await fig.evaluate((f) => { f.scrollLeft = f.scrollWidth; });
  const row = fig.locator('tr[data-row="urea"] th[scope="row"]');
  const [name, box] = [await row.textContent(), await fig.boundingBox()];
  const th = (await row.boundingBox())!;
  expect(name).toContain("ยูเรีย");
  expect(th.x, "the row name is still on screen after scrolling to the far right").toBeGreaterThanOrEqual(box!.x - 1);
  expect(th.x + th.width).toBeLessThanOrEqual(box!.x + box!.width + 1);
});

test("the 3D plant either draws or shows its fallback; never an empty or oversized canvas", async ({ page }) => {
  await open(page, "/th/ch01");
  await page.locator(".deficiency").scrollIntoViewIfNeeded();
  const box = page.locator(".deficiency .scene3d");
  await expect(box.first()).toBeVisible();
  await expect(page.locator(".scene3d canvas:visible")).toBeVisible();
  // Wait until the scene has sized itself (a fresh canvas is 300 x 150 until it has).
  await expect(page.locator(".scene3d canvas")).toHaveAttribute("data-region-old", /.+/);
  const sizes = await page.locator(".scene3d canvas").evaluate((c) => ({ w: c.getBoundingClientRect().width, h: c.getBoundingClientRect().height, cw: (c as HTMLCanvasElement).width, ch: (c as HTMLCanvasElement).height }));
  expect(sizes.w).toBeLessThanOrEqual(390);
  expect(sizes.h).toBeGreaterThan(150);
  // The drawing buffer exists and is not larger than the 2x cap allows, even on this 3x screen.
  expect(sizes.cw / sizes.w).toBeLessThanOrEqual(2.01);
  expect(sizes.cw).toBeGreaterThan(0);
  // A finger tap on the old leaves selects them, as on iPad.
  const region = await page.locator(".scene3d canvas").getAttribute("data-region-old");
  const [x, y, w, h] = region!.split(",").map(Number) as [number, number, number, number];
  const b = (await page.locator(".scene3d canvas").boundingBox())!;
  await page.getByRole("group", { name: "เลือกตำแหน่งใบ" }).getByLabel("ใบอ่อน/ยอด", { exact: true }).check();
  await page.touchscreen.tap(b.x + x + w / 2, b.y + y + h / 2);
  await expect(page.locator(".def-option input:checked")).toHaveAttribute("value", "old");
});

test("with WebGL unavailable the phone shows the fallback text, and the choices and table still work", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (/webgl/.test(type)) return null;
      return (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof original;
  });
  await open(page, "/th/ch01");
  await page.locator(".deficiency").scrollIntoViewIfNeeded();
  await expect(page.locator(".scene3d-fallback")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByRole("group", { name: "เลือกตำแหน่งใบ" }).getByLabel("เอกสารไม่ระบุตำแหน่งใบ", { exact: true }).check();
  await expect(page.locator('.def-panel [data-row="zn"]')).toBeVisible();
});

test("the interactive widgets fit and work at 390 px: calculator, bag reader, crop matcher, quiz", async ({ page }) => {
  await open(page, "/th/ch03");
  const calc = page.locator("section.calculator");
  await calc.getByLabel("ปริมาณธาตุที่ต้องการ (กก./ไร่)").fill("10");
  await calc.getByLabel("เลือกสูตรที่มีในเอกสาร").selectOption({ label: "46-0-0 ยูเรีย" });
  await calc.getByRole("button", { name: "คำนวณ" }).tap();
  await expect(calc.getByRole("status")).toContainText("≈ 22");
  await page.locator("label.bag-tile").nth(1).tap();
  await expect(page.locator(".bag-panel")).toContainText("P");

  await open(page, "/th/ch05");
  await page.getByRole("group", { name: "เลือกพืช" }).getByLabel("ทุเรียน", { exact: true }).tap();
  await expect(page.locator(".crop-panel .panel")).toHaveAttribute("data-crop", "durian");

  await open(page, "/th/ch07");
  await page.locator('.quiz-item[data-question="0"]').getByRole("button", { name: "ดูคำตอบ" }).tap();
  await expect(page.locator('.quiz-item[data-question="0"] .quiz-a')).toBeVisible();

  const [sw, cw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(sw).toBeLessThanOrEqual(cw);
});

test("the diagram scales down to the phone and its text stays readable", async ({ page }) => {
  await open(page, "/th/ch02");
  const sizes = await page.locator("svg[data-timing]").evaluate((el) => {
    const scale = el.getBoundingClientRect().width / (el as unknown as SVGSVGElement).viewBox.baseVal.width;
    return { scale, min: Math.min(...[...el.querySelectorAll("text")].map((t) => parseFloat(getComputedStyle(t).fontSize) * scale)), width: el.getBoundingClientRect().width };
  });
  expect(sizes.width).toBeLessThanOrEqual(390);
  expect(sizes.min).toBeGreaterThanOrEqual(14);
});
