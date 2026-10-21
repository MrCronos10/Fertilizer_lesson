import { expect, test } from "@playwright/test";
import { collectPageProblems } from "./console";

const CHAPTERS = ["ch01", "ch02", "ch03", "ch04", "ch05", "ch06", "ch07"];
// ch06 (glossary) and ch07 (summary, quiz) carry no citations in the source, so
// they show the source page only; the other five cite and must resolve.
const CITING = ["ch01", "ch02", "ch03", "ch04", "ch05"];

test("every chapter ends in a ที่มาของข้อมูล section naming its source pages", async ({ page }) => {
  const problems = collectPageProblems(page);
  for (const slug of CHAPTERS) {
    // networkidle: leaving while Next's link prefetch is in flight makes WebKit
    // report the cancelled fetch as a page error, which is test churn, not a defect.
    await page.goto(`/th/${slug}`, { waitUntil: "networkidle" });
    const heading = page.locator("#sources").getByRole("heading", { level: 2, name: "ที่มาของข้อมูล" });
    await expect(heading, slug).toBeVisible();
    await expect(page.locator("#sources"), slug).toContainText("หน้าในเอกสารต้นฉบับ");
  }
  expect(problems).toEqual([]);
});

test("every citing chapter lists sources, and every inline citation points at one", async ({ page }) => {
  for (const slug of CITING) {
    await page.goto(`/th/${slug}`);
    expect(await page.locator("#sources .source-list > li").count(), slug).toBeGreaterThan(0);
    const hrefs = await page.locator("a[data-cite]").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    for (const href of hrefs) {
      const target = page.locator(`#sources li${href}`);
      await expect(target, `${slug} ${href}`).toHaveCount(1);
    }
  }
});

test("a tier badge carries text and a shape; commercial reads differently from official", async ({ page }) => {
  await page.goto("/th/ch05");
  const badges = page.locator("#sources .tier");
  expect(await badges.count()).toBeGreaterThan(5);
  for (const badge of await badges.all()) {
    const text = (await badge.innerText()).trim();
    expect(text).toMatch(/[◆●▲]/u);
    expect(text.replace(/[◆●▲\s]/gu, "").length).toBeGreaterThan(2);
  }
  const style = (selector: string) =>
    page.locator(`#sources ${selector}`).first().evaluate((el) => {
      const s = getComputedStyle(el);
      return { border: s.borderTopStyle, color: s.color, background: s.backgroundColor };
    });
  const commercial = await style(".tier-commercial");
  const trusted = await style(".tier-official, .tier-research");
  expect(commercial.border).toBe("dashed");
  expect(trusted.border).toBe("solid");
  expect(commercial.background).not.toBe(trusted.background);
});

test("the badge's accessible text announces its tier", async ({ page }) => {
  await page.goto("/th/ch05");
  const text = await page.locator("#sources .tier-commercial").first().textContent();
  expect(text).toContain("ระดับแหล่งที่มา");
  expect(text).toContain("เชิงพาณิชย์");
});

test("external source links open safely", async ({ page }) => {
  await page.goto("/th/ch05");
  const links = page.locator("#sources a[href^='http']");
  expect(await links.count()).toBeGreaterThan(5);
  for (const rel of await links.evaluateAll((as) => as.map((a) => a.getAttribute("rel")))) {
    expect(rel).toContain("noopener");
  }
});

test("the sources jump link stays in reach from anywhere and lands on the section", async ({ page }) => {
  await page.goto("/th/ch02");
  const jump = page.locator(".jump-sources");
  await expect(jump).toBeInViewport();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await expect(jump).toBeInViewport();
  const box = await jump.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  await jump.click();
  await expect(page).toHaveURL(/#sources$/);
  await expect(page.getByRole("heading", { name: "ที่มาของข้อมูล" })).toBeInViewport();
});

test("a clicked citation lands below the sticky bar, not under it", async ({ page }) => {
  await page.goto("/th/ch02");
  const first = page.locator("a[data-cite]").first();
  const id = await first.getAttribute("href");
  await first.click();
  const barBottom = (await page.locator(".jump-sources").boundingBox())!.y +
    (await page.locator(".jump-sources").boundingBox())!.height;
  const target = (await page.locator(`#sources li${id}`).boundingBox())!;
  expect(target.y, "target hidden under the sticky bar").toBeGreaterThanOrEqual(barBottom - 1);
});

test("the hidden tier label stays in the accessibility tree", async ({ page }) => {
  await page.goto("/th/ch05");
  const hidden = page.locator("#sources .tier .visually-hidden").first();
  const style = await hidden.evaluate((el) => {
    const s = getComputedStyle(el);
    return { display: s.display, visibility: s.visibility, position: s.position };
  });
  expect(style.display).not.toBe("none");
  expect(style.visibility).toBe("visible");
  expect(style.position).toBe("absolute");
  // Read order: the label comes before the tier name.
  const text = (await page.locator("#sources .tier-commercial").first().textContent())!;
  expect(text.indexOf("ระดับแหล่งที่มา")).toBeLessThan(text.indexOf("เชิงพาณิชย์"));
});

test("sources section needs no horizontal scroll with long URLs", async ({ page }) => {
  for (const slug of CHAPTERS) {
    await page.goto(`/th/${slug}`);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, slug).toBeLessThanOrEqual(0);
  }
});
