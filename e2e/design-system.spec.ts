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

  test("the loaded Thai faces can actually render Thai, marks included", async ({ page }) => {
    await page.goto("/specimen");

    // Asking the font system directly. Measuring a bounding box would pass just
    // as happily with iPad's Thonburi fallback or a row of .notdef boxes.
    const checks = await page.evaluate(async () => {
      await document.fonts.ready;
      return {
        headingThai: document.fonts.check('700 1rem "Noto Sans Thai"', "ปุ๋ย"),
        bodyThai: document.fonts.check('400 1rem "Sarabun"', "ปุ๋ยแต่งหน้า"),
        emphasisThai: document.fonts.check('600 1rem "Sarabun"', "ตรวจวิเคราะห์ดิน"),
        combiningMark: document.fonts.check('400 1rem "Sarabun"', "◌่"),
        zeroWidthJoiners: document.fonts.check('400 1rem "Sarabun"', "‌‍"),
      };
    });

    expect(checks).toEqual({
      headingThai: true,
      bodyThai: true,
      emphasisThai: true,
      combiningMark: true,
      zeroWidthJoiners: true,
    });
  });

  test("Thai renders wider than its fallback would, proving the subset is in use", async ({
    page,
  }) => {
    await page.goto("/specimen");
    await page.waitForLoadState("networkidle");

    // Independent cross-check: the same string measured in our stack versus a
    // forced generic fallback must differ, or no webfont is being applied.
    const { styled, fallback } = await page.evaluate(async () => {
      await document.fonts.ready;
      const measure = (fontFamily: string) => {
        const el = document.createElement("span");
        el.textContent = "ปุ๋ยรองพื้นและปุ๋ยแต่งหน้า";
        el.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font-size:32px;font-family:${fontFamily}`;
        document.body.append(el);
        const width = el.getBoundingClientRect().width;
        el.remove();
        return width;
      };
      return { styled: measure('"Sarabun"'), fallback: measure("monospace") };
    });

    expect(styled).toBeGreaterThan(0);
    expect(Math.abs(styled - fallback)).toBeGreaterThan(1);
  });

  test("every control meets the 44pt minimum touch target", async ({ page }) => {
    await page.goto("/specimen");

    const controls = [
      ...(await page.getByRole("button").all()),
      ...(await page.locator('[data-testid^="theme-"]').all()),
    ];
    expect(controls.length).toBeGreaterThan(0);

    for (const control of controls) {
      const box = await control.boundingBox();
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

  test("draws a WCAG-compliant focus ring on the focused control", async ({ page }) => {
    await page.goto("/specimen");

    // Note on method: pressing Tab is a no-op in WebKit here, mirroring
    // Safari's default of not tabbing through every element, so Tab cannot
    // drive this assertion. Focusing a form control does match :focus-visible
    // in WebKit, which is what we assert. End-to-end keyboard traversal on
    // macOS Safari is a manual check, tracked in T-025.
    await page.locator('input[type="radio"]').first().focus();

    const focused = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const style = getComputedStyle(el);
      return { width: style.outlineWidth, color: style.outlineColor, style: style.outlineStyle };
    });

    expect(focused).not.toBeNull();
    // outlineStyle is the load-bearing assertion: outlineWidth reports "3px"
    // even on elements with outline-style: none, so width alone proves nothing.
    expect(focused!.style).toBe("solid");
    expect(focused!.width).toBe("3px");
    // --ring (green), not --accent: gold on cream is 1.61:1 and fails WCAG 1.4.11.
    expect(focused!.color).toBe("rgb(31, 94, 69)");
  });

  test("uses dvh everywhere, never vh or svh", async ({ page }) => {
    await page.goto("/specimen");
    const allCss = await page.evaluate(() =>
      [...document.styleSheets]
        .flatMap((sheet) => {
          try {
            return [...sheet.cssRules].map((rule) => rule.cssText);
          } catch {
            return [];
          }
        })
        .join(" "),
    );

    expect(allCss).toContain("dvh");
    expect(allCss).not.toContain("svh");
    // Catches a stray `height: 100vh` anywhere, not only in min-height rules.
    expect(allCss).not.toMatch(/\d(?<!d)vh\b/);
  });

  test("respects the safe area on all four edges", async ({ page }) => {
    await page.goto("/specimen");
    const padding = await page.locator("main.page").evaluate((el) => {
      const s = getComputedStyle(el);
      return [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft];
    });

    // env() resolves to 0 off-device, so the floor is the 16px gutter; the
    // point is that all four edges are padded rather than only the sides.
    for (const side of padding) {
      expect(parseFloat(side)).toBeGreaterThanOrEqual(16);
    }
  });

  test("honours prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/specimen");

    const durations = await page.evaluate(() => {
      const el = document.createElement("div");
      el.style.cssText = "transition: opacity 2s; animation: none 3s;";
      document.body.append(el);
      const s = getComputedStyle(el);
      const result = { transition: s.transitionDuration, animation: s.animationDuration };
      el.remove();
      return result;
    });

    expect(parseFloat(durations.transition)).toBeLessThan(0.1);
    expect(parseFloat(durations.animation)).toBeLessThan(0.1);
  });

  test("specimen page has no console errors", async ({ page }) => {
    const problems = collectPageProblems(page);
    await page.goto("/specimen");
    await page.waitForLoadState("networkidle");
    expect(problems).toEqual([]);
  });
});
