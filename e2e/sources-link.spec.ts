import { expect, test } from "@playwright/test";

test("a chapter page's header offers the sources link, and it lands on the sources section", async ({ page }) => {
  await page.goto("/th/ch01");
  const link = page.locator(".site-header").getByRole("link", { name: "ที่มาของข้อมูล" });
  await expect(link).toHaveAttribute("href", "#sources");
  expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await link.click();
  await expect(page).toHaveURL(/#sources$/);
  await expect(page.getByRole("heading", { level: 2, name: "ที่มาของข้อมูล" })).toBeInViewport();
});

test("every chapter has the jump link; the home page's sources links open the all-sources page", async ({ page }) => {
  for (const n of ["01", "02", "03", "04", "05", "06", "07"]) {
    await page.goto(`/th/ch${n}`);
    await expect(page.locator(".site-header a[href='#sources']"), `ch${n}`).toHaveCount(1);
    await expect(page.locator("#sources"), `ch${n} target`).toHaveCount(1);
  }
  await page.goto("/th");
  await expect(page.locator(".site-header a[href='#sources']")).toHaveCount(0);
  const header = page.locator(".site-header").getByRole("link", { name: "ที่มาของข้อมูล", exact: true });
  await expect(header).toHaveAttribute("href", "/th/sources");
  const button = page.locator(".safe-note").getByRole("link", { name: "ที่มาของข้อมูลทั้งหมด" });
  await expect(button).toHaveAttribute("href", "/th/sources");
  expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await button.click();
  await expect(page).toHaveURL(/\/th\/sources$/);
});

test("the header still fits narrow screens; its links show from 40em up, as the phone artboards have only the logo and the theme button", async ({ page }) => {
  for (const width of [320, 390, 640, 834]) {
    await page.setViewportSize({ width, height: 700 });
    await page.goto("/th/ch01");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${width}`).toBe(true);
    const shown = await page.locator(".site-header .site-link").evaluateAll((els) => els.filter((e) => getComputedStyle(e).display !== "none").length);
    expect(shown, `${width}`).toBe(width >= 640 ? 2 : 0);
    for (const el of await page.locator(".site-header a:visible, .site-header button:visible").all())
      expect((await el.boundingBox())!.height, `${width}`).toBeGreaterThanOrEqual(44);
  }
});

test("client-side navigation from the home page to a chapter and back adds and drops the link", async ({ page }) => {
  await page.goto("/th");
  await expect(page.locator(".site-header a[href='#sources']")).toHaveCount(0);
  await expect(page.locator(".site-header a[href='/th/sources']")).toHaveCount(1);
  await page.locator("#chapters a").first().click();
  await expect(page).toHaveURL(/ch01$/);
  await expect(page.locator(".site-header a[href='#sources']")).toHaveCount(1);
  await expect(page.locator(".site-header a[href='/th/sources']")).toHaveCount(0);
  await page.goBack();
  await expect(page.locator(".site-header a[href='#sources']")).toHaveCount(0);
});
