import { expect, test, type Page } from "@playwright/test";

/** Chapter 3's calculator in the redesign (T-046), from the Bag-Calculator artboards; the arithmetic is e2e/calculator. */
const ROUTE = "/th/ch03";
const calc = (page: Page) => page.locator(".calculator");

async function urea(page: Page) {
  await calc(page).getByLabel("ปริมาณธาตุที่ต้องการ (กก./ไร่)").fill("10");
  await calc(page).getByLabel("N (%)").fill("46");
  await calc(page).getByLabel("P₂O₅ (%)").fill("0");
  await calc(page).getByLabel("K₂O (%)").fill("0");
  await calc(page).getByRole("button", { name: "คำนวณ" }).click();
}

test("the artboards' sizes: the title 21 px (landscape) or 20 px, 48 px fields and choices, the grade fields on one row", async ({ page }) => {
  for (const [width, title] of [[1366, "21px"], [834, "20px"], [390, "20px"]] as const) {
    await page.setViewportSize({ width, height: 1024 });
    await page.goto(ROUTE);
    expect(await calc(page).locator("h2").evaluate((el) => getComputedStyle(el).fontSize), `${width}`).toBe(title);
    for (const el of await calc(page).locator('input[type="text"], select, .calc-choice').all())
      expect((await el.boundingBox())!.height, `${width}`).toBeGreaterThanOrEqual(48);
    const ys = await calc(page).locator(".calc-grade-fields input").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().y)));
    expect(new Set(ys).size, `${width}: grade fields on one row`).toBe(1);
  }
});

test("the chosen nutrient is marked by its border, not by colour alone, and the result is a card with the brand edge", async ({ page }) => {
  await page.goto(ROUTE);
  const chosen = calc(page).locator(".calc-choice").first();
  const other = calc(page).locator(".calc-choice").nth(1);
  expect(await chosen.evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe("none");
  expect(await other.evaluate((el) => getComputedStyle(el).boxShadow)).toBe("none");
  await urea(page);
  const card = calc(page).locator(".calc-result > .rate-block");
  await expect(card).toContainText("≈ 22");
  // The answer line as the artboard draws it: the UI face, bold, 24 px in landscape (this project runs at its own width).
  const answer = calc(page).locator(".calc-answer");
  expect(await answer.evaluate((el) => getComputedStyle(el).fontWeight)).toBe("700");
  expect(["22px", "24px"]).toContain(await answer.evaluate((el) => getComputedStyle(el).fontSize));
  expect(await card.evaluate((el) => getComputedStyle(el).borderInlineStartWidth)).toBe("5px");
  await expect(card.locator(".note")).toBeVisible();
});

test("the native picker keeps the system font (a web font on it stalled `load`, T-014)", async ({ page }) => {
  await page.goto(ROUTE);
  expect(await calc(page).locator("select").evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(/system-ui/);
});
