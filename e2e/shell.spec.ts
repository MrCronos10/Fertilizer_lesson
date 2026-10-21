import { gzipSync } from "node:zlib";
import { expect, test } from "@playwright/test";
import { collectPageProblems } from "./console";

const CHAPTERS = ["ch01", "ch02", "ch03", "ch04", "ch05", "ch06", "ch07"];

test("/ redirects to /th", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/th$/);
});

// Under cacheComponents the response status is fixed at 200 before notFound()
// runs (Next docs: loading.md "Status codes"), so the guarantee is the not-found
// page plus a noindex tag, not an HTTP 404. A Proxy could return a true 404; that
// is an architecture change left to the owner (see TASKS.md T-010).
test("an unsupported locale or chapter renders not-found and is noindex", async ({ request, page }) => {
  for (const path of ["/km", "/th/ch99"]) {
    const html = await (await request.get(path)).text();
    expect(html, path).toMatch(/<meta name="robots" content="noindex"/);
    expect(html, path).not.toContain("อาหารของพืช");
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).not.toHaveText(/บทที่/);
  }
});

test("the contents list links every chapter from frontmatter", async ({ page }) => {
  const problems = collectPageProblems(page);
  await page.goto("/th");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("เรียนรู้เรื่องปุ๋ย");
  const links = page.getByRole("navigation", { name: "สารบัญ" }).getByRole("link");
  await expect(links).toHaveCount(CHAPTERS.length);
  await expect(links.first()).toHaveText(/บทที่ 1/);
  expect(problems).toEqual([]);
});

test("every chapter opens from the list, has one h1, and logs no errors", async ({ page }) => {
  const problems = collectPageProblems(page);
  for (const [index, slug] of CHAPTERS.entries()) {
    await page.goto("/th");
    await page.getByRole("navigation", { name: "สารบัญ" }).getByRole("link").nth(index).click();
    await expect(page).toHaveURL(new RegExp(`/th/${slug}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    // No layout overflow: nothing pushes the page wider than the viewport.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${slug} overflows horizontally`).toBeLessThanOrEqual(0);
  }
  expect(problems).toEqual([]);
});

test("chapter text is in the server-rendered HTML", async ({ request }) => {
  const html = await (await request.get("/th/ch01")).text();
  expect(html).toContain("อาหารของพืช");
});

test("the Cambodian table slot never reaches the page", async ({ request }) => {
  const html = await (await request.get("/th/ch05")).text();
  // The slot may exist, hidden and empty; no Cambodian soil-group row may.
  expect(html).not.toMatch(/<table/);
});

test("prev/next walk the chapters in order", async ({ page }) => {
  await page.goto("/th/ch02");
  await page.getByRole("link", { name: /บทถัดไป/ }).click();
  await expect(page).toHaveURL(/\/th\/ch03$/);
  await page.getByRole("link", { name: /บทก่อนหน้า/ }).click();
  await expect(page).toHaveURL(/\/th\/ch02$/);
  await page.goto("/th/ch01");
  await expect(page.getByRole("link", { name: /บทก่อนหน้า/ })).toHaveCount(0);
  await page.goto("/th/ch07");
  await expect(page.getByRole("link", { name: /บทถัดไป/ })).toHaveCount(0);
});

test("keyboard: skip link is first, becomes visible, and reaches content", async ({ page, browserName }) => {
  test.skip(browserName !== "webkit");
  await page.goto("/th");
  // Safari's default Tab skips links unless Option is held; focus() mirrors what
  // the Option-Tab user does, so this tests the link, not the OS setting.
  const skip = page.locator(".skip-link");
  await skip.focus();
  await expect(skip).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#content$/);
});

test("navigation targets are at least 44 CSS px tall", async ({ page }) => {
  for (const url of ["/th", "/th/ch02"]) {
    await page.goto(url);
    for (const link of await page.locator("header a, nav a").all()) {
      const box = await link.boundingBox();
      expect(box?.height ?? 0, `${url} link too short`).toBeGreaterThanOrEqual(44);
    }
  }
});

test("respects safe-area padding on the shell", async ({ page }) => {
  await page.goto("/th");
  const padding = await page.locator("#content").evaluate((el) => getComputedStyle(el).paddingLeft);
  expect(parseFloat(padding)).toBeGreaterThan(0);
});

test("text routes ship at most 180 KB gzipped JS", async ({ request }) => {
  for (const route of ["/th", ...CHAPTERS.map((c) => `/th/${c}`)]) {
    const html = await (await request.get(route)).text();
    const srcs = [...new Set([...html.matchAll(/<script[^>]+src="([^"]+\.js[^"]*)"/g)].map((m) => m[1]))];
    let total = 0;
    for (const src of srcs) {
      const body = await (await request.get(src as string)).body();
      total += gzipSync(body).length;
    }
    expect(srcs.length, `${route} found no scripts to measure`).toBeGreaterThan(0);
    expect(total, `${route} JS is ${total} bytes gzipped`).toBeLessThanOrEqual(180 * 1024);
  }
});
