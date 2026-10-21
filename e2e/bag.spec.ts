import { expect, test, type Locator, type Page } from "@playwright/test";
import { collectPageProblems } from "./console";

const CASES = [
  { name: "N 16", role: "N = ใบเขียว โตเร็ว", amount: "กระสอบ 50 กก. มี N 8 กก." },
  { name: "P₂O₅ 20", role: "P = ราก ดอก เมล็ด", amount: "กระสอบ 50 กก. มี P₂O₅ 10 กก." },
  { name: "K₂O 0", role: "K = ผลโต หวาน ต้นแข็ง ทนโรค", amount: "กระสอบ 50 กก. ไม่มี K" },
];

async function open(page: Page) {
  // networkidle: the reader hydrates from its own lazy chunk (see calculator.spec.ts).
  await page.goto("/th/ch03", { waitUntil: "networkidle" });
  const group = page.getByRole("group", { name: "ตัวเลข 3 ตัวบนกระสอบ", exact: true });
  await expect(group).toBeVisible();
  return { group, panel: page.locator(".bag-panel") };
}

/** The tile around a radio. `has` needs a locator relative to the label, so it is built from the page. */
const tile = (page: Page, name: string) => page.locator("label.bag-tile", { has: page.getByRole("radio", { name }) });

/** A finger on iPad, a click on Mac: the tile is what a person actually presses. */
async function press(tile: Locator) {
  if (test.info().project.use.hasTouch) await tile.tap();
  else await tile.click();
}


test("three radios named for what a bag prints, with no console errors", async ({ page }) => {
  const problems = collectPageProblems(page);
  const { group } = await open(page);
  for (const c of CASES) await expect(group.getByRole("radio", { name: c.name })).toHaveCount(1);
  expect(problems).toEqual([]);
});

test("a radio's accessible name carries the pamphlet's word 'percent', once, and the tile text is hidden from assistive tech", async ({ page }) => {
  const { group } = await open(page);
  await expect(group.getByRole("radio", { name: "N 16 เปอร์เซ็นต์", exact: true })).toHaveCount(1);
  await expect(group.getByRole("radio", { name: "P₂O₅ 20 เปอร์เซ็นต์", exact: true })).toHaveCount(1);
  await expect(group.getByRole("radio", { name: "K₂O 0 เปอร์เซ็นต์", exact: true })).toHaveCount(1);
  // The visible symbol and number would otherwise be read a second time as static text.
  const hidden = await group.locator("label.bag-tile").evaluateAll((labels) =>
    labels.map((l) => [...l.querySelectorAll(".bag-symbol, .bag-number")].every((s) => s.getAttribute("aria-hidden") === "true")),
  );
  expect(hidden).toEqual([true, true, true]);
});

test("the bag's weight and the English symbols are right on screen", async ({ page }) => {
  const { group, panel } = await open(page);
  await expect(group.locator(".bag-weight")).toHaveText("50 กก.");
  for (const el of await group.locator(".bag-symbol").all()) await expect(el).toHaveAttribute("lang", "en");
  await expect(panel.locator("span[lang=en]").first()).toHaveText("N");
});

test("the radios are reachable and form one group with one tab stop", async ({ page }) => {
  // macOS Safari does not Tab onto radios unless Full Keyboard Access or Option-Tab is on, so
  // Tab itself cannot be driven here; this asserts what the markup controls instead.
  const { group } = await open(page);
  const info = await group.locator("input[type=radio]").evaluateAll((inputs) =>
    (inputs as HTMLInputElement[]).map((i) => ({ name: i.name, tabIndex: i.tabIndex, disabled: i.disabled, checked: i.checked, hidden: i.hidden })),
  );
  expect(info).toHaveLength(3);
  expect(new Set(info.map((i) => i.name)).size).toBe(1);
  expect(info.every((i) => i.tabIndex >= 0 && !i.disabled && !i.hidden)).toBe(true);
  expect(info.filter((i) => i.checked)).toHaveLength(1);
});

test("N is already explained on arrival, so the panel is never empty", async ({ page }) => {
  const { group, panel } = await open(page);
  await expect(group.getByRole("radio", { name: "N 16" })).toBeChecked();
  await expect(panel).toContainText(CASES[0]!.role);
  await expect(panel).toContainText(CASES[0]!.amount);
});

test("pressing each number explains it in the pamphlet's words, with the page it came from", async ({ page }) => {
  const { group, panel } = await open(page);
  for (const c of [CASES[1]!, CASES[2]!, CASES[0]!]) {
    await press(tile(page, c.name));
    await expect(group.getByRole("radio", { name: c.name })).toBeChecked();
    await expect(panel).toContainText(c.role);
    await expect(panel).toContainText(c.amount);
    await expect(panel).toContainText("หน้าในเอกสารต้นฉบับ: 2, 6");
    // Only the chosen number's explanation is on screen.
    for (const other of CASES.filter((o) => o !== c)) await expect(panel).not.toContainText(other.role);
  }
});

test("every tile is at least 44×44 and the whole tile is the target", async ({ page }) => {
  const { group } = await open(page);
  const tiles = group.locator("label.bag-tile");
  await expect(tiles).toHaveCount(3);
  for (const tile of await tiles.all()) {
    const box = await tile.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  }
});

test("works from the keyboard: arrow keys move the choice, and the focused tile shows a ring", async ({ page }) => {
  const { group, panel } = await open(page);
  await group.getByRole("radio", { name: "N 16" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(group.getByRole("radio", { name: "P₂O₅ 20" })).toBeChecked();
  await expect(panel).toContainText(CASES[1]!.role);
  await page.keyboard.press("ArrowRight");
  await expect(group.getByRole("radio", { name: "K₂O 0" })).toBeChecked();
  await expect(panel).toContainText(CASES[2]!.amount);
  await page.keyboard.press("ArrowLeft");
  await expect(group.getByRole("radio", { name: "P₂O₅ 20" })).toBeChecked();
  const ring = await tile(page, "P₂O₅ 20").evaluate((el) => {
    const s = getComputedStyle(el);
    return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
  });
  expect(ring.style).not.toBe("none");
  expect(ring.width).toBeGreaterThanOrEqual(3);
});

test("a choice is announced: a polite, atomic live region that is replaced on each change", async ({ page }) => {
  const { panel } = await open(page);
  await expect(panel).toHaveAttribute("role", "status");
  await expect(panel).toHaveAttribute("aria-live", "polite");
  await expect(panel).toHaveAttribute("aria-atomic", "true");
  const before = await panel.locator(":scope > *").first().elementHandle();
  await press(tile(page, "P₂O₅ 20"));
  await expect(panel).toContainText(CASES[1]!.role);
  expect(await before!.evaluate((el) => el.isConnected), "the old explanation node is still in the page").toBe(false);
});

test("nothing is revealed by hover alone", async ({ page }) => {
  await open(page);
  const hoverRules = await page.evaluate(() => {
    const found: string[] = [];
    for (const sheet of [...document.styleSheets]) {
      let rules: CSSRuleList;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      const walk = (list: CSSRuleList) => {
        for (const rule of [...list]) {
          if (rule instanceof CSSStyleRule && /bag/.test(rule.selectorText) && /:hover/.test(rule.selectorText)) found.push(rule.selectorText);
          if ("cssRules" in rule && (rule as CSSGroupingRule).cssRules) walk((rule as CSSGroupingRule).cssRules);
        }
      };
      walk(rules);
    }
    return found;
  });
  expect(hoverRules).toEqual([]);
});

test("the label is real text: selectable, in the DOM, not a canvas or image", async ({ page }) => {
  await open(page);
  await expect(page.locator(".bag-reader canvas, .bag-reader img, .bag-reader svg")).toHaveCount(0);
  for (const c of CASES) {
    const cell = tile(page, c.name);
    await expect(cell).toContainText(c.name.split(" ")[0]!);
    await expect(cell).toContainText(c.name.split(" ")[1]!);
    const select = await cell.evaluate((el) => getComputedStyle(el).userSelect);
    expect(select).not.toBe("none");
  }
});

test("the page can be zoomed", async ({ page }) => {
  await open(page);
  const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
  expect(viewport).toBeTruthy();
  expect(viewport).not.toMatch(/user-scalable\s*=\s*(no|0)/i);
  expect(viewport).not.toMatch(/maximum-scale\s*=\s*1(\.0)?\b/i);
});

test("the numbers are large and legible, and nothing scrolls sideways at the project width or on a phone", async ({ page }) => {
  const { group } = await open(page);
  const numberSize = await group.locator(".bag-number").first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  const symbolSize = await group.locator(".bag-symbol").first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(numberSize).toBeGreaterThanOrEqual(32);
  expect(symbolSize).toBeGreaterThanOrEqual(16);
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(await overflow()).toBeLessThanOrEqual(0);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await overflow()).toBeLessThanOrEqual(0);
});

for (const scheme of ["light", "dark"] as const) {
  test(`tiles are legible in ${scheme}, chosen and not`, async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: scheme });
    const page = await context.newPage();
    await open(page);
    const rgb = (v: string) => v.match(/[\d.]+/g)!.map(Number);
    const lum = ([r, g, b]: number[]) => {
      const f = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!);
    };
    const ratio = (a: number[], b: number[]) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
      return (hi! + 0.05) / (lo! + 0.05);
    };
    const colours = (label: Locator) =>
      label.evaluate((el) => ({ fg: getComputedStyle(el).color, bg: getComputedStyle(el).backgroundColor, border: getComputedStyle(el).borderTopColor }));
    const chosen = await colours(tile(page, "N 16"));
    const other = await colours(tile(page, "K₂O 0"));
    expect(ratio(rgb(chosen.fg), rgb(chosen.bg))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(rgb(other.fg), rgb(other.bg))).toBeGreaterThanOrEqual(4.5);
    // Not colour alone: the chosen tile also differs in fill from the others.
    expect(chosen.bg).not.toBe(other.bg);
    await context.close();
  });
}

test("only chapter 3 carries the bag reader", async ({ request }) => {
  for (const slug of ["ch01", "ch02", "ch04", "ch05", "ch06", "ch07"]) {
    expect(await (await request.get(`/th/${slug}`)).text(), slug).not.toContain("bag-reader");
  }
  expect(await (await request.get("/th/ch03")).text()).toContain("bag-reader");
});

test("the reader and the calculator coexist: the page still reaches load every time", async ({ page }) => {
  for (let i = 0; i < 6; i++) {
    await page.goto("/th/ch02", { timeout: 10_000 });
    await page.goto("/th/ch03", { timeout: 10_000 });
  }
});
