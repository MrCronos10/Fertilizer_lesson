import { expect, test, type Page } from "@playwright/test";
import { collectPageProblems } from "./console";

/*
 * The home page (T-027): one route drawn from five artboards. Landscape numbers are checked
 * against Main.dc.html / Home-Hero-Fallback.dc.html at their own 1366 px width.
 */

const NO_WEBGL = () => {
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
    if (/webgl/.test(type)) return null;
    return (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
  } as typeof original;
};

const TRACK_CONTEXTS = () => {
  const made: WebGLRenderingContext[] = [];
  const w = window as unknown as { __made: WebGLRenderingContext[]; __peak: number };
  w.__peak = 0;
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
    const ctx = (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
    if (ctx && /webgl/.test(type) && !made.includes(ctx as WebGLRenderingContext)) {
      made.push(ctx as WebGLRenderingContext);
      w.__peak = Math.max(w.__peak, made.filter((gl) => !gl.isContextLost()).length);
    }
    return ctx;
  } as typeof original;
  w.__made = made;
};

const alive = (page: Page) =>
  page.evaluate(() => (window as unknown as { __made: WebGLRenderingContext[] }).__made.filter((gl) => !gl.isContextLost()).length);

const hero = (page: Page) => page.evaluate(() => document.documentElement.dataset.hero);
const canvas = (page: Page) => page.locator(".hero-stage canvas");
const card = (page: Page) => page.locator(".soil-card");

test("with WebGL the live block draws, under HTML labels, and the flat plate is hidden", async ({ page }) => {
  const problems = collectPageProblems(page);
  await page.goto("/th");
  expect(await hero(page)).toBe("3d");
  await expect(canvas(page)).toBeVisible();
  await expect(card(page)).toBeHidden();
  await expect(page.locator(".hero-stage .scene3d")).toHaveAttribute("role", "img");
  // D3: every word is HTML, selectable and in the accessibility tree.
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("เรียนรู้เรื่องปุ๋ย");
  for (const e of ["N", "P", "K"]) await expect(page.locator(`[data-label="${e}"]`)).toContainText(e);
  await expect(page.locator('[data-label="N"]')).toContainText("ใบเขียว โตเร็ว");
  expect(problems).toEqual([]);
});

test("the block turns when dragged and settles back to the drawn view", async ({ page, isMobile }) => {
  test.skip(isMobile);
  await page.goto("/th");
  const c = canvas(page);
  await expect(c).toHaveAttribute("data-yaw", "-0.280");
  const box = (await c.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2, { steps: 6 });
  // Held: the frame loop publishes the turned angle and does not settle while the pointer is down.
  await expect.poll(async () => Number(await c.getAttribute("data-yaw"))).toBeGreaterThan(0.5);
  await page.mouse.up();
  await expect(c).toHaveAttribute("data-yaw", "-0.280", { timeout: 5000 });
});

test("D16: one live context, released when leaving for chapter 1 and back", async ({ page }) => {
  await page.addInitScript(TRACK_CONTEXTS);
  await page.goto("/th");
  await expect(canvas(page)).toBeVisible();
  expect(await alive(page)).toBe(1);
  for (let i = 0; i < 2; i++) {
    await page.getByRole("navigation", { name: "สารบัญ" }).getByRole("link").first().click();
    await expect(page).toHaveURL(/\/th\/ch01$/);
    // Chapter 1 loads its plant only near the viewport (NearViewport, T-024).
    await page.locator(".deficiency").scrollIntoViewIfNeeded();
    await expect(page.locator(".scene3d canvas:visible")).toBeVisible();
    await expect.poll(() => alive(page)).toBe(1);
    await page.goBack();
    await expect(canvas(page)).toBeVisible();
    await expect.poll(() => alive(page)).toBe(1);
  }
  expect(await page.evaluate(() => (window as unknown as { __peak: number }).__peak)).toBeLessThanOrEqual(1);
});

test("without WebGL the flat hero shows from the first paint, with no canvas and no errors", async ({ page }) => {
  const problems = collectPageProblems(page);
  await page.addInitScript(NO_WEBGL);
  await page.goto("/th");
  expect(await hero(page)).toBe("flat");
  await expect(card(page)).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  expect(problems).toEqual([]);
});

test("prefers-reduced-motion gets the flat hero, not a still canvas", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/th");
  expect(await hero(page)).toBe("flat");
  await expect(card(page)).toBeVisible();
  await page.waitForTimeout(500);
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("without JavaScript the page is whole: flat hero, labels and every chapter link", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/th");
  await expect(card(page)).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "สารบัญ" }).getByRole("link")).toHaveCount(7);
  await context.close();
});

test("chapter markers are real links, in order, each at least 44 px", async ({ page }) => {
  await page.goto("/th");
  const links = page.getByRole("navigation", { name: "สารบัญ" }).getByRole("link");
  await expect(links).toHaveCount(7);
  for (let i = 0; i < 7; i++) {
    const link = links.nth(i);
    await expect(link).toHaveAttribute("href", `/th/ch0${i + 1}`);
    await expect(link).toHaveAccessibleName(new RegExp(`บทที่ ${i + 1}`));
    const box = (await link.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);
  }
});

test("markers do not overlap each other on the path", async ({ page }) => {
  await page.goto("/th");
  const boxes = await page.locator(".marker-dot").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON() as DOMRect));
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]!;
      const b = boxes[j]!;
      const overlap = a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      expect(overlap, `dots ${i + 1} and ${j + 1} overlap`).toBe(false);
    }
});

test("the theme button flips day and night, says what it will do, and is remembered", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/th");
  const toggle = page.locator(".theme-toggle");
  await expect(toggle).toHaveAccessibleName("สลับเป็นโหมดกลางคืน");
  const title = page.getByRole("heading", { level: 1 });
  await expect(title).toHaveCSS("color", "rgb(21, 66, 47)"); // #15422F
  await toggle.click();
  await expect(toggle).toHaveAccessibleName("สลับเป็นโหมดกลางวัน");
  await expect(title).toHaveCSS("color", "rgb(237, 239, 230)"); // #EDEFE6
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");
  await expect(title).toHaveCSS("color", "rgb(237, 239, 230)");
  await page.locator(".theme-toggle").click();
  await expect(title).toHaveCSS("color", "rgb(21, 66, 47)");
});

test("no sideways scroll, in either hero", async ({ page }) => {
  for (const flat of [false, true]) {
    if (flat) await page.addInitScript(NO_WEBGL);
    await page.goto("/th");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, flat ? "flat" : "3d").toBeLessThanOrEqual(0);
  }
});

test.describe("at Main.dc.html's own width", () => {
  test.skip(({ viewport }) => viewport?.width !== 1366, "landscape artboard numbers");

  test("the live hero sits where Main draws it", async ({ page }) => {
    await page.goto("/th");
    await expect(canvas(page)).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCSS("font-size", "60px");
    const heroTop = (await page.locator(".hero").boundingBox())!.y;
    const n = (await page.locator('[data-label="N"]').boundingBox())!;
    expect(Math.round(n.x)).toBe(1046);
    expect(Math.round(n.y - heroTop)).toBe(140);
    expect(Math.round(n.width)).toBe(268);
    expect((await page.locator(".hero").boundingBox())!.height).toBe(500);
    expect((await page.locator("#chapters").boundingBox())!.height).toBe(376);
  });

  test("leader lines run from each label to the block", async ({ page }) => {
    await page.goto("/th");
    await expect(canvas(page)).toBeVisible();
    const c = (await canvas(page).boundingBox())!;
    for (const e of ["N", "P", "K"]) {
      const path = page.locator(`[data-leader="${e}"]`);
      await expect(path).toHaveAttribute("d", /^M/);
      const end = (await path.getAttribute("d"))!.split("L").at(-1)!.trim().split(" ").map(Number);
      const svg = (await page.locator("#hero-leaders").boundingBox())!;
      const [x, y] = [svg.x + end[0]!, svg.y + end[1]!];
      expect(x).toBeGreaterThan(c.x);
      expect(x).toBeLessThan(c.x + c.width);
      expect(y).toBeGreaterThan(c.y);
      expect(y).toBeLessThan(c.y + c.height);
    }
  });

  test("the flat hero sits where Home-Hero-Fallback draws it", async ({ page }) => {
    await page.addInitScript(NO_WEBGL);
    await page.goto("/th");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCSS("font-size", "56px");
    const heroTop = (await page.locator(".hero").boundingBox())!.y;
    const n = (await page.locator('[data-label="N"]').boundingBox())!;
    expect(Math.round(n.x)).toBe(1122);
    expect(Math.round(n.y - heroTop)).toBe(150);
    expect((await page.locator(".hero").boundingBox())!.height).toBe(556);
  });
});
