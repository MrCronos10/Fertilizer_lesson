import { gzipSync } from "node:zlib";
import { expect, test, type Page, type Response } from "@playwright/test";

const ROUTE = "/specimen-3d";

/** Records every WebGL context the page creates, so "alive" is measured, not assumed. */
const TRACK_CONTEXTS = () => {
  const made: WebGLRenderingContext[] = [];
  const w = window as unknown as { __made: WebGLRenderingContext[]; __peak: number };
  w.__peak = 0;
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
    const ctx = (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
    if (ctx && /webgl/.test(type) && !made.includes(ctx as WebGLRenderingContext)) {
      made.push(ctx as WebGLRenderingContext);
      // Overlap is measured at the moment a context is born: every earlier one still alive counts.
      w.__peak = Math.max(w.__peak, made.filter((gl) => !gl.isContextLost()).length);
    }
    return ctx;
  } as typeof original;
  w.__made = made;
};

const NO_WEBGL = () => {
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
    if (/webgl/.test(type)) return null;
    return (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
  } as typeof original;
};

const counts = (page: Page) =>
  page.evaluate(() => {
    const made = (window as unknown as { __made: WebGLRenderingContext[] }).__made;
    return {
      made: made.length,
      alive: made.filter((gl) => !gl.isContextLost()).length,
      // Rendered ones: React tears a hidden route's DOM down at low priority, but the context is what costs memory.
      canvases: [...document.querySelectorAll("canvas")].filter((c) => c.getClientRects().length > 0).length,
      peak: (window as unknown as { __peak: number }).__peak,
    };
  });

async function ready(page: Page) {
  await expect(page.locator(".scene3d canvas:visible")).toBeVisible();
  await expect(page.locator(".scene3d canvas:visible")).toHaveAttribute("data-angle", /.+/);
}

test("exactly one WebGL context is alive on the 3D route, and the probe context is released", async ({ page }) => {
  await page.addInitScript(TRACK_CONTEXTS);
  await page.goto(ROUTE);
  await ready(page);
  const c = await counts(page);
  expect(c.made, "probe + scene").toBeGreaterThanOrEqual(2);
  expect(c.alive).toBe(1);
  expect(c.canvases).toBe(1);
});

test("leaving and re-entering the 3D route never leaks a context", async ({ page }) => {
  await page.addInitScript(TRACK_CONTEXTS);
  await page.goto(ROUTE);
  await ready(page);
  for (let i = 0; i < 6; i++) {
    await page.getByRole("link", { name: "Leave this page" }).click(); // client-side navigation
    await expect(page).toHaveURL(/\/th$/);
    const away = await counts(page);
    expect(away.alive, `lap ${i}: none alive off the 3D route`).toBe(0);
    expect(away.canvases, `lap ${i}: no canvas left in the DOM`).toBe(0);
    await page.goBack(); // popstate, still client-side
    await ready(page);
    const back = await counts(page);
    expect(back.alive, `lap ${i}: one alive on return`).toBe(1);
    expect(back.canvases).toBe(1);
  }
  // The 6 re-entries really built new contexts; they were recycled, not reused.
  expect((await counts(page)).made).toBeGreaterThanOrEqual(7);
});

test("going from one 3D route to another never holds two contexts at once", async ({ page }) => {
  await page.addInitScript(TRACK_CONTEXTS);
  await page.goto(ROUTE);
  await ready(page);
  for (let i = 0; i < 4; i++) {
    await page.getByRole("link", { name: "To the second 3D route" }).click();
    await expect(page).toHaveURL(/specimen-3d-b$/);
    await ready(page);
    await page.getByRole("link", { name: "To the first 3D route" }).click();
    await expect(page).toHaveURL(/specimen-3d$/);
    await ready(page);
  }
  const c = await counts(page);
  expect(c.alive).toBe(1);
  expect(c.canvases).toBe(1);
  expect(c.peak, "no moment with two live contexts").toBe(1);
});

test("if the browser takes the context back, the fallback replaces the dead canvas", async ({ page }) => {
  await page.addInitScript(TRACK_CONTEXTS);
  await page.goto(ROUTE);
  await ready(page);
  await page.evaluate(() => {
    const made = (window as unknown as { __made: WebGLRenderingContext[] }).__made;
    made.find((gl) => !gl.isContextLost())?.getExtension("WEBGL_lose_context")?.loseContext();
  });
  await expect(page.locator(".scene3d-fallback")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("if the real canvas cannot be created after the probe passed, the page survives with the fallback", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    let calls = 0;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (/webgl/.test(type) && ++calls > 1) return null; // the probe's one try passes; the renderer's do not
      return (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof original;
  });
  await page.goto(ROUTE);
  await expect(page.locator(".scene3d-fallback")).toBeVisible();
  await expect(page.locator("#lesson-text")).toBeVisible();
});

test("without WebGL the fallback renders and the text stays readable", async ({ page }) => {
  await page.addInitScript(NO_WEBGL);
  await page.goto(ROUTE);
  await expect(page.locator(".scene3d-fallback")).toBeVisible();
  await expect(page.locator("#lesson-text")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("idle animation runs normally and stops under prefers-reduced-motion", async ({ page }) => {
  const angle = () => page.locator(".scene3d canvas:visible").getAttribute("data-angle");

  await page.goto(ROUTE);
  await ready(page);
  const a = await angle();
  await page.waitForTimeout(600);
  expect(await angle(), "animating by default").not.toBe(a);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(300);
  const b = await angle();
  await page.waitForTimeout(600);
  expect(await angle(), "frozen under reduced motion").toBe(b);
});

test("a reduced-motion visitor gets a still first frame, not an empty canvas", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(ROUTE);
  await ready(page);
  await page.waitForTimeout(500);
  expect(await page.locator(".scene3d canvas:visible").getAttribute("data-angle")).toBe("0.000");
  await context.close();
});

test("the drawing buffer is capped at 2x even on a 3x display", async ({ browser }) => {
  const context = await browser.newContext({ deviceScaleFactor: 3, viewport: { width: 768, height: 1024 } });
  const page = await context.newPage();
  await page.goto(ROUTE);
  await ready(page);
  const ratio = await page
    .locator(".scene3d canvas:visible")
    .evaluate((el) => (el as HTMLCanvasElement).width / el.getBoundingClientRect().width);
  expect(ratio).toBeLessThanOrEqual(2.01);
  expect(ratio).toBeGreaterThan(1.5); // it did use the 2x it was allowed
  await context.close();
});

async function scriptsLoaded(page: Page, route: string) {
  const bodies: Promise<{ size: number; text: string }>[] = [];
  const onResponse = (r: Response) => {
    if (/\.js(\?|$)/.test(r.url()))
      bodies.push(r.body().then((b) => ({ size: gzipSync(b).length, text: b.toString("utf8") })));
  };
  page.on("response", onResponse);
  await page.goto(route, { waitUntil: "networkidle" });
  page.off("response", onResponse);
  return Promise.all(bodies);
}

test("the 3D route ships at most 600 KB gzipped JS and does carry three.js", async ({ page }) => {
  const scripts = await scriptsLoaded(page, ROUTE);
  const total = scripts.reduce((n, s) => n + s.size, 0);
  expect(total, `${ROUTE} JS is ${total} bytes gzipped`).toBeLessThanOrEqual(600 * 1024);
  expect(scripts.some((s) => s.text.includes("WebGLRenderer")), "control: three.js is on the 3D route").toBe(true);
});

test("chapter 1 (the deficiency explorer) is a 3D route: within 600 KB and carrying three.js", async ({ page }) => {
  const scripts = await scriptsLoaded(page, "/th/ch01");
  const total = scripts.reduce((n, s) => n + s.size, 0);
  expect(total, `/th/ch01 JS is ${total} bytes gzipped`).toBeLessThanOrEqual(600 * 1024);
  expect(scripts.some((s) => s.text.includes("WebGLRenderer"))).toBe(true);
});

test("three.js is absent from every non-3D route", async ({ page }) => {
  for (const route of ["/th", "/th/ch02", "/th/ch03", "/th/ch04", "/th/ch05", "/th/ch06", "/th/ch07", "/specimen"]) {
    const scripts = await scriptsLoaded(page, route);
    expect(scripts.length, `${route} loaded scripts`).toBeGreaterThan(0);
    expect(
      scripts.some((s) => s.text.includes("WebGLRenderer")),
      `${route} must not load three.js`,
    ).toBe(false);
  }
});
