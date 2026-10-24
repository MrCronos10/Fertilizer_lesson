import { expect, test, type Page } from "@playwright/test";

/** Chapter 3's bag reader in the redesign (T-045), from the Bag-Calculator artboards; behaviour is e2e/bag.spec.ts. */
const ROUTE = "/th/ch03";
const tile = (page: Page, n: number) => page.locator(".bag-tile").nth(n);
const rgb = { n: "rgb(47, 111, 62)", p2o5: "rgb(132, 86, 176)", k2o: "rgb(181, 84, 30)" } as const;
const LABEL = { n: "N", p2o5: "P₂O₅", k2o: "K₂O" } as const;

test("landscape: the sack fills the 620 px column, its tiles are 134 px, and the answer sits under it", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 1024 });
  await page.goto(ROUTE);
  expect((await page.locator(".bag-body").boundingBox())!.width).toBeCloseTo(620, 0);
  expect((await tile(page, 0).boundingBox())!.height).toBeGreaterThanOrEqual(134);
  expect(await page.locator(".bag legend").evaluate((el) => getComputedStyle(el).fontSize)).toBe("19px");
  const bag = (await page.locator(".bag").boundingBox())!;
  const answer = (await page.locator(".bag-answer").boundingBox())!;
  expect(answer.y).toBeGreaterThan(bag.y + bag.height);
});

test("portrait: the 420 px sack sits beside its answer, tiles 112 px", async ({ page }) => {
  await page.setViewportSize({ width: 834, height: 1194 });
  await page.goto(ROUTE);
  const bag = (await page.locator(".bag-body").boundingBox())!;
  expect(bag.width).toBeCloseTo(420, 0);
  expect((await tile(page, 0).boundingBox())!.height).toBeGreaterThanOrEqual(112);
  expect(await page.locator(".bag legend").evaluate((el) => getComputedStyle(el).fontSize)).toBe("18px");
  const answer = (await page.locator(".bag-answer").boundingBox())!;
  expect(answer.x).toBeGreaterThan(bag.x + bag.width);
  expect(answer.y).toBeCloseTo(bag.y - 31, -2);
});

test("phone: the sack and its answer stack, every tile at least 44 px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(ROUTE);
  for (let i = 0; i < 3; i++) {
    const b = (await tile(page, i).boundingBox())!;
    expect(b.width).toBeGreaterThanOrEqual(44);
    expect(b.height).toBeGreaterThanOrEqual(44);
  }
  const bag = (await page.locator(".bag").boundingBox())!;
  expect((await page.locator(".bag-answer").boundingBox())!.y).toBeGreaterThan(bag.y + bag.height);
});

for (const [i, id] of [[0, "n"], [1, "p2o5"], [2, "k2o"]] as const) {
  test(`choosing ${LABEL[id]} colours its tile, the answer's edge and badge with the artboard's ${LABEL[id]} colour, in both themes`, async ({ page }) => {
    for (const scheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(ROUTE);
      await tile(page, i).click();
      await expect(page.locator(".bag-answer")).toHaveAttribute("data-nutrient", id);
      expect(await tile(page, i).evaluate((el) => getComputedStyle(el).backgroundColor), scheme).toBe(rgb[id]);
      expect(await page.locator(".bag-answer").evaluate((el) => getComputedStyle(el).borderTopColor), scheme).toBe(rgb[id]);
      expect(await page.locator(".bag-badge").evaluate((el) => getComputedStyle(el).backgroundColor), scheme).toBe(rgb[id]);
      expect(await tile(page, i).evaluate((el) => getComputedStyle(el).color), scheme).toBe("rgb(255, 255, 255)");
    }
  });
}

test("the arrow keys move between the numbers, and the answer follows", async ({ page }) => {
  await page.goto(ROUTE);
  // The reader is a lazy client chunk: a key pressed before it hydrates moves the native radio but not the answer.
  // Wait until a tap is answered, then go back to N and use the keys.
  await expect(async () => {
    await tile(page, 2).click();
    await expect(page.locator(".bag-answer")).toHaveAttribute("data-nutrient", "k2o", { timeout: 1000 });
  }).toPass();
  await tile(page, 0).click();
  await expect(page.locator(".bag-answer")).toHaveAttribute("data-nutrient", "n");
  await page.locator(".bag-input").first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".bag-answer")).toHaveAttribute("data-nutrient", "p2o5");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".bag-answer")).toHaveAttribute("data-nutrient", "k2o");
});
