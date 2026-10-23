import { expect, test, type Page } from "@playwright/test";

/** The explorer page's 3D plant (T-038). */
const ROUTE = "/th/ch01/deficiency";
const canvas = (page: Page) => page.locator(".def-picture .scene3d canvas:visible");

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
  page.evaluate(() => (window as unknown as { __made: WebGLRenderingContext[] }).__made.filter((g) => !g.isContextLost()).length);
const peak = (page: Page) => page.evaluate(() => (window as unknown as { __peak: number }).__peak);

async function region(page: Page, which: "old" | "young") {
  const box = (await canvas(page).boundingBox())!;
  const attr = await canvas(page).getAttribute(which === "old" ? "data-region-old" : "data-region-young");
  const [x, y, w, h] = attr!.split(",").map(Number) as [number, number, number, number];
  return { cx: box.x + x + w / 2, cy: box.y + y + h / 2, w, h };
}
const chosen = (page: Page) => page.locator(".def-answer").getAttribute("data-group");

test("the plant draws in the artboard's frame, filling it, with a spoken name", async ({ page }) => {
  await page.goto(ROUTE);
  await expect(canvas(page)).toBeVisible();
  await expect(canvas(page)).toHaveAttribute("data-region-old", /.+/);
  await expect(page.locator(".def-picture .scene3d")).toHaveAttribute("role", "img");
  await expect(page.locator(".def-picture .scene3d")).toHaveAttribute("aria-label", "ภาพวาดต้นพืชสามมิติ ลากเพื่อหมุน");
  const frame = (await page.locator(".def-picture").boundingBox())!;
  const c = (await canvas(page).boundingBox())!;
  expect(c.width).toBeGreaterThanOrEqual(frame.width - 3);
  expect(c.height).toBeGreaterThanOrEqual(frame.height - 3);
  expect(frame.width / frame.height).toBeCloseTo(826 / 582, 1);
});

test("both leaf groups are on screen, inside the frame, and at least 44 px", async ({ page }) => {
  await page.goto(ROUTE);
  await expect(canvas(page)).toHaveAttribute("data-region-young", /.+/);
  const c = (await canvas(page).boundingBox())!;
  for (const which of ["old", "young"] as const) {
    const r = await region(page, which);
    expect(r.w, which).toBeGreaterThanOrEqual(44);
    expect(r.h, which).toBeGreaterThanOrEqual(44);
    expect(r.cx).toBeGreaterThan(c.x);
    expect(r.cx).toBeLessThan(c.x + c.width);
    expect(r.cy).toBeGreaterThan(c.y);
    expect(r.cy).toBeLessThan(c.y + c.height);
  }
});

test("tapping the leaves in the plant changes the answer, and a drag turns it without choosing", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(ROUTE);
  await expect(canvas(page)).toHaveAttribute("data-region-young", /.+/);
  const young = await region(page, "young");
  await page.mouse.click(young.cx, young.cy);
  await expect.poll(() => chosen(page)).toBe("young");
  const before = Number(await canvas(page).getAttribute("data-yaw"));
  const old = await region(page, "old");
  await page.mouse.move(old.cx, old.cy);
  await page.mouse.down();
  await page.mouse.move(old.cx + 90, old.cy, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => Number(await canvas(page).getAttribute("data-yaw"))).toBeGreaterThan(before + 0.5);
  expect(await chosen(page), "a drag must not choose").toBe("young");
  await page.mouse.click((await region(page, "old")).cx, (await region(page, "old")).cy);
  await expect.poll(() => chosen(page)).toBe("old");
});

test("under reduced motion the plant holds still", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(ROUTE);
  await expect(canvas(page)).toHaveAttribute("data-yaw", /.+/);
  const a = await canvas(page).getAttribute("data-yaw");
  await page.waitForTimeout(600);
  expect(await canvas(page).getAttribute("data-yaw")).toBe(a);
});

test("one live context on the page; to chapter 1's plant and back never holds two (D16)", async ({ page }) => {
  await page.addInitScript(TRACK_CONTEXTS);
  await page.goto(ROUTE);
  await expect(canvas(page)).toBeVisible();
  // The <canvas> is in the page a moment before its context exists: wait for the count, do not read it at once.
  await expect.poll(() => alive(page)).toBe(1);
  await page.locator(".def-back").click();
  await expect(page).toHaveURL(/\/th\/ch01$/);
  await page.locator(".deficiency").scrollIntoViewIfNeeded();
  await expect(page.locator(".deficiency .scene3d canvas:visible")).toBeVisible();
  await expect.poll(() => alive(page)).toBe(1);
  await page.goBack();
  await expect(page).toHaveURL(/deficiency$/);
  await expect(canvas(page)).toBeVisible();
  await expect.poll(() => alive(page)).toBe(1);
  expect(await peak(page), "no moment with two live contexts").toBe(1);
});

test("without WebGL the frame shows the flat plant and the note, the picker still works, and there is no canvas", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (/webgl/.test(type)) return null;
      return (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof original;
  });
  await page.goto(ROUTE);
  const flat = page.locator(".def-picture").getByRole("img", { name: "ภาพต้นพืช แสดงตำแหน่งใบแก่ด้านล่างและใบอ่อนหรือยอดด้านบน" });
  await expect(flat).toBeVisible();
  await expect(page.locator(".def-picture figcaption")).toHaveText("เครื่องนี้แสดงภาพสามมิติไม่ได้ ใช้ตัวเลือกด้านบนและตารางด้านล่างแทน");
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByRole("group", { name: "เลือกตำแหน่งใบ" }).getByLabel("ใบอ่อน/ยอด", { exact: true }).check();
  await expect(flat).toHaveAttribute("data-leaf", "young");
  await expect(page.locator(".def-answer")).toHaveAttribute("data-group", "young");
});

/* ---- The callouts over the plant (T-039) ---- */
const hotspot = (page: Page, name: string) => page.locator(".def-picture").getByRole("button", { name, exact: true });
const OLD = "เลือกใบแก่";
const YOUNG = "เลือกใบอ่อนหรือยอด";

test("each leaf group has a real button on it, at least 44 px, inside the frame, saying which is chosen", async ({ page }) => {
  await page.goto(ROUTE);
  await expect(hotspot(page, OLD)).toBeVisible();
  const frame = (await page.locator(".def-picture").boundingBox())!;
  for (const name of [OLD, YOUNG]) {
    const b = (await hotspot(page, name).boundingBox())!;
    expect(b.width, name).toBeGreaterThanOrEqual(44);
    expect(b.height, name).toBeGreaterThanOrEqual(44);
    expect(b.x).toBeGreaterThanOrEqual(frame.x);
    expect(b.x + b.width).toBeLessThanOrEqual(frame.x + frame.width);
    expect(b.y).toBeGreaterThanOrEqual(frame.y);
    expect(b.y + b.height).toBeLessThanOrEqual(frame.y + frame.height);
  }
  await expect(hotspot(page, OLD)).toHaveAttribute("aria-pressed", "true");
  await expect(hotspot(page, YOUNG)).toHaveAttribute("aria-pressed", "false");
  // Old leaves low and to the left, young ones high and to the right, as drawn.
  const o = (await hotspot(page, OLD).boundingBox())!;
  const y = (await hotspot(page, YOUNG).boundingBox())!;
  expect(o.y).toBeGreaterThan(y.y);
  expect(o.x).toBeLessThan(y.x);
});

test("the labels name each group from the source's rule, with a line to their hotspot, and the hint sits at the foot", async ({ page }) => {
  await page.goto(ROUTE);
  await expect(hotspot(page, OLD)).toBeVisible();
  await expect(page.locator(".def-callout-old")).toHaveText("ใบแก่ธาตุที่เคลื่อนที่ได้ในพืช");
  await expect(page.locator(".def-callout-young")).toHaveText("ใบอ่อน/ยอดธาตุที่เคลื่อนที่ไม่ได้");
  await expect(page.locator(".def-picture .def-hint")).toHaveText("ลากเพื่อหมุน · แตะจุดบนใบเพื่อดูอาการ");
  const label = (await page.locator(".def-callout-old").boundingBox())!;
  const spot = (await hotspot(page, OLD).boundingBox())!;
  expect(label.x + label.width, "the old label sits left of its hotspot").toBeLessThan(spot.x);
  for (const side of ["old", "young"]) {
    const w = await page.locator(".def-leader").nth(side === "old" ? 0 : 1).evaluate((el) => el.getBoundingClientRect().width);
    expect(w, `${side} leader`).toBeGreaterThan(10);
  }
});

test("a hotspot chooses its group by tap and by keyboard", async ({ page }) => {
  await page.goto(ROUTE);
  await hotspot(page, YOUNG).click();
  await expect(page.locator(".def-answer")).toHaveAttribute("data-group", "young");
  await expect(hotspot(page, YOUNG)).toHaveAttribute("aria-pressed", "true");
  await expect(hotspot(page, OLD)).toHaveAttribute("aria-pressed", "false");
  await hotspot(page, OLD).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".def-answer")).toHaveAttribute("data-group", "old");
  await hotspot(page, YOUNG).focus();
  await page.keyboard.press("Space");
  await expect(page.locator(".def-answer")).toHaveAttribute("data-group", "young");
  // The radios below agree.
  await expect(page.getByRole("group", { name: "เลือกตำแหน่งใบ" }).getByLabel("ใบอ่อน/ยอด", { exact: true })).toBeChecked();
});

test("the callouts follow the plant when it is zoomed", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(ROUTE);
  await expect(hotspot(page, YOUNG)).toBeVisible();
  const before = (await hotspot(page, YOUNG).boundingBox())!;
  const c = (await canvas(page).boundingBox())!;
  await page.mouse.move(c.x + c.width / 2, c.y + c.height / 2);
  await page.keyboard.down("Control");
  for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 40);
  await page.keyboard.up("Control");
  await expect.poll(async () => Math.abs((await hotspot(page, YOUNG).boundingBox())!.y - before.y)).toBeGreaterThan(8);
  const label = (await page.locator(".def-callout-young").boundingBox())!;
  const spot = (await hotspot(page, YOUNG).boundingBox())!;
  expect(label.x, "the label went with it").toBeGreaterThan(spot.x);
});

test("after a drag turns the plant, each hotspot still sits on its own leaf group", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(ROUTE);
  await expect(hotspot(page, OLD)).toBeVisible();
  const c = (await canvas(page).boundingBox())!;
  const before = Number(await canvas(page).getAttribute("data-yaw"));
  await page.mouse.move(c.x + c.width * 0.6, c.y + c.height * 0.55);
  await page.mouse.down();
  await page.mouse.move(c.x + c.width * 0.6 + 120, c.y + c.height * 0.55, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => Number(await canvas(page).getAttribute("data-yaw"))).toBeGreaterThan(before + 0.5);
  for (const [name, which] of [[OLD, "old"], [YOUNG, "young"]] as const) {
    const b = (await hotspot(page, name).boundingBox())!;
    const r = await region(page, which);
    const [cx, cy] = [b.x + b.width / 2, b.y + b.height / 2];
    expect(Math.abs(cx - r.cx), `${which} across`).toBeLessThan(r.w / 2);
    expect(Math.abs(cy - r.cy), `${which} up and down`).toBeLessThan(r.h / 2);
  }
});

test("a focused hotspot shows the site's focus ring", async ({ page }) => {
  await page.goto(ROUTE);
  await expect(hotspot(page, OLD)).toBeVisible();
  // WebKit's Tab skips buttons unless Safari's "Press Tab to highlight each item" is on, so focus it directly.
  await hotspot(page, OLD).focus();
  await expect(hotspot(page, OLD)).toBeFocused();
  expect(await hotspot(page, OLD).evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("solid");
});

test("without WebGL there are no hotspots, labels or hint, only the flat plant and the picker", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (/webgl/.test(type)) return null;
      return (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof original;
  });
  await page.goto(ROUTE);
  await expect(page.locator(".def-picture .flat-fallback")).toBeVisible();
  await expect(page.locator(".def-picture").getByRole("button")).toHaveCount(0);
  await expect(page.locator(".def-picture .def-hint")).toBeHidden();
  await expect(page.locator(".def-callout-old")).toBeHidden();
});
