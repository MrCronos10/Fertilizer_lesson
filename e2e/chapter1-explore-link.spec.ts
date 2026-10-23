import { expect, test, type Page } from "@playwright/test";

/** Chapter 1's way into the deficiency explorer (T-041), from the Chapter-01 artboards' footer. */
const LINK = "สำรวจอาการขาดธาตุแบบ 3 มิติ";
const explore = (page: Page) => page.locator(".chapter-nav").getByRole("link", { name: LINK });

test("chapter 1's footer has the artboard's primary button into the explorer; the next chapter stays, outlined", async ({ page }) => {
  await page.goto("/th/ch01");
  await expect(explore(page)).toHaveAttribute("href", "/th/ch01/deficiency");
  const box = (await explore(page).boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(48);
  const look = (sel: string) => page.locator(sel).evaluate((el) => getComputedStyle(el).backgroundColor);
  const brand = await page.evaluate(() => {
    const probe = document.createElement("span");
    probe.style.background = "var(--brand)";
    document.body.append(probe);
    const c = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return c;
  });
  expect(await look(".chapter-nav .chapter-explore")).toBe(brand);
  expect(await look('.chapter-nav a[rel="next"]')).not.toBe(brand);
  await expect(page.locator('.chapter-nav a[rel="next"]')).toBeVisible();
  // Last in the row, as drawn: the contents on the left, the explorer on the right.
  const links = page.locator(".chapter-nav a");
  await expect(links.last()).toHaveText(LINK);
});

test("no other chapter has the explorer button", async ({ page }) => {
  await page.goto("/th/ch02");
  await expect(page.getByRole("link", { name: LINK })).toHaveCount(0);
});

test("the button opens the explorer, and Back returns to chapter 1", async ({ page }) => {
  await page.goto("/th/ch01");
  await explore(page).click();
  await expect(page).toHaveURL(/\/th\/ch01\/deficiency$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("อาการขาดธาตุ");
  await page.goBack();
  await expect(page).toHaveURL(/\/th\/ch01$/);
});

test("from chapter 1's 3D plant to the explorer's and back, never two live WebGL contexts (D16)", async ({ page }) => {
  await page.addInitScript(() => {
    const made: WebGLRenderingContext[] = [];
    const w = window as unknown as { __made: WebGLRenderingContext[]; __peak: number };
    w.__peak = 0;
    w.__made = made;
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      const ctx = (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
      if (ctx && /webgl/.test(type) && !made.includes(ctx as WebGLRenderingContext)) {
        made.push(ctx as WebGLRenderingContext);
        w.__peak = Math.max(w.__peak, made.filter((gl) => !gl.isContextLost()).length);
      }
      return ctx;
    } as typeof original;
  });
  const alive = () =>
    page.evaluate(() => (window as unknown as { __made: WebGLRenderingContext[] }).__made.filter((g) => !g.isContextLost()).length);
  await page.goto("/th/ch01");
  await page.locator(".deficiency").scrollIntoViewIfNeeded();
  await expect(page.locator(".deficiency .scene3d canvas:visible")).toBeVisible();
  // The <canvas> is in the page a moment before its context exists: wait for the count, do not read it at once.
  await expect.poll(alive).toBe(1);
  await explore(page).click();
  await expect(page).toHaveURL(/deficiency$/);
  await expect(page.locator(".def-picture .scene3d canvas:visible")).toBeVisible();
  await expect.poll(alive).toBe(1);
  await page.goBack();
  await expect(page).toHaveURL(/\/th\/ch01$/);
  await page.locator(".deficiency").scrollIntoViewIfNeeded();
  await expect(page.locator(".deficiency .scene3d canvas:visible")).toBeVisible();
  await expect.poll(alive).toBe(1);
  expect(await page.evaluate(() => (window as unknown as { __peak: number }).__peak), "no moment with two live contexts").toBe(1);
});
