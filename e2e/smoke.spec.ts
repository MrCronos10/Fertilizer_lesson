import { expect, test } from "@playwright/test";
import { collectPageProblems } from "./console";

test("home page loads with no console errors", async ({ page }) => {
  const problems = collectPageProblems(page);

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  expect(problems).toEqual([]);
});

test("document declares Thai as its language", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "th");
});

// Guard, not a formality: every v1 target browser is WebKit (PRD §6). A Chromium
// project added later would pass tests while telling us nothing about Safari.
test("runs on WebKit", async ({ browserName }) => {
  expect(browserName).toBe("webkit");
});
