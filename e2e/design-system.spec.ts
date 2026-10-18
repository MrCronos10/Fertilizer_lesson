import { expect, test } from "@playwright/test";
import { collectPageProblems } from "./console";

const TAP_MIN = 44;

test.describe("design system", () => {
  test("serves the Thai font subsets from our own origin", async ({ page }) => {
    const fontRequests: string[] = [];
    page.on("response", (res) => {
      if (res.url().includes(".woff2")) fontRequests.push(`${res.status()} ${res.url()}`);
    });

    await page.goto("/specimen");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.waitForLoadState("networkidle");

    // No third-party font origin.
    expect(fontRequests.some((r) => r.includes("gstatic") || r.includes("googleapis"))).toBe(false);
    // Thai subsets actually loaded, and successfully.
    expect(fontRequests.some((r) => r.startsWith("200") && r.includes("sarabun-400-thai"))).toBe(
      true,
    );
    expect(
      fontRequests.some((r) => r.startsWith("200") && r.includes("noto-sans-thai-700-thai")),
    ).toBe(true);
  });

  test("applies Noto Sans Thai to headings and Sarabun to body", async ({ page }) => {
    await page.goto("/specimen");

    const headingFont = await page
      .getByRole("heading", { level: 1 })
      .first()
      .evaluate((el) => getComputedStyle(el).fontFamily);
    expect(headingFont).toContain("Noto Sans Thai");

    const bodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(bodyFont).toContain("Sarabun");
  });

  test("renders Thai tone marks with real glyphs, not fallback boxes", async ({ page }) => {
    await page.goto("/specimen");
    await page.waitForLoadState("networkidle");

    // A missing glyph collapses to near-zero advance width or a .notdef box;
    // measuring the rendered line catches both.
    const box = await page.getByTestId("tone-marks").boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThan(20);

    const dotted = await page.getByTestId("dotted-circle").boundingBox();
    expect(dotted!.width).toBeGreaterThan(100);
  });

  test("every control meets the 44pt minimum touch target", async ({ page }) => {
    await page.goto("/specimen");

    const buttons = await page.getByRole("button").all();
    expect(buttons.length).toBeGreaterThan(0);

    for (const button of buttons) {
      const box = await button.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(TAP_MIN);
      expect(box!.width).toBeGreaterThanOrEqual(TAP_MIN);
    }
  });

  test("honours the system dark preference", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/specimen");
    const dark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/specimen");
    const light = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

    expect(dark).not.toBe(light);
    expect(dark).toBe("rgb(14, 25, 20)");
    expect(light).toBe("rgb(243, 241, 232)");
  });

  test("data-theme overrides the system preference", async ({ page }) => {
    // System says dark; an explicit light choice must win.
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/specimen");

    await page.getByTestId("theme-light").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
      "rgb(243, 241, 232)",
    );

    await page.getByTestId("theme-dark").click();
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
      "rgb(14, 25, 20)",
    );

    // Back to system (dark) — the attribute is removed, not set to "system".
    await page.getByTestId("theme-system").click();
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.*/);
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
      "rgb(14, 25, 20)",
    );
  });

  test("shows a focus ring for keyboard users", async ({ page }) => {
    await page.goto("/specimen");

    await page.getByTestId("btn-primary").focus();
    const outline = await page
      .getByTestId("btn-primary")
      .evaluate((el) => getComputedStyle(el).outlineWidth);
    expect(outline).toBe("3px");
  });

  test("uses dvh rather than vh or svh for full-height layout", async ({ page }) => {
    await page.goto("/specimen");
    const minHeight = await page.evaluate(() => {
      const sheets = [...document.styleSheets];
      return sheets
        .flatMap((s) => {
          try {
            return [...s.cssRules].map((r) => r.cssText);
          } catch {
            return [];
          }
        })
        .filter((t) => t.includes("min-height"))
        .join(" ");
    });
    expect(minHeight).toContain("dvh");
    expect(minHeight).not.toContain("svh");
  });

  test("specimen page has no console errors", async ({ page }) => {
    const problems = collectPageProblems(page);
    await page.goto("/specimen");
    await page.waitForLoadState("networkidle");
    expect(problems).toEqual([]);
  });
});
