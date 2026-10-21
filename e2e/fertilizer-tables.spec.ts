import { expect, test, type Page } from "@playwright/test";
import { collectPageProblems } from "./console";

const ROUTE = "/th/ch02";
const TABLES = [
  { name: "organic", row: "cow-manure", rows: 5, page: "3", headings: ["ชนิด", "N-P-K (%)", "ลักษณะ / ใช้กับ"] },
  { name: "straight", row: "urea", rows: 7, page: "4", headings: ["ปุ๋ย", "สูตร", "ลักษณะ", "ใช้กับ"] },
  { name: "compound", row: "balanced", rows: 6, page: "5", headings: ["สูตร", "ใช้กับ"] },
  { name: "conditioners", row: "marl", rows: 4, page: "5", headings: ["วัสดุ", "ใช้ทำอะไร", "ปริมาณเทียบกับหินปูนบด"] },
] as const;

const table = (page: Page, row: string) => page.locator("table.source-table", { has: page.locator(`tr[data-row="${row}"]`) });

test("each fertilizer table renders its rows, headings and page from the data", async ({ page }) => {
  const problems = collectPageProblems(page);
  await page.goto(ROUTE);
  for (const t of TABLES) {
    const el = table(page, t.row);
    await expect(el, t.name).toHaveCount(1);
    await expect(el.locator("thead th"), t.name).toHaveText([...t.headings]);
    await expect(el.locator("tbody tr"), t.name).toHaveCount(t.rows);
    await expect(el.locator(`tbody tr[data-source-page="${t.page}"]`), t.name).toHaveCount(t.rows);
    await expect(el.locator("xpath=..").locator("figcaption"), t.name).toContainText(`หน้าในเอกสารต้นฉบับ: ${t.page}`);
  }
  expect(problems).toEqual([]);
});

test("the figures are exactly as printed, including compost's trailing zero", async ({ page }) => {
  await page.goto(ROUTE);
  const organic = table(page, "cow-manure");
  await expect(organic.locator('tr[data-row="compost"] td').first()).toHaveText("1.5-0.4-1.0");
  await expect(organic.locator('tr[data-row="chicken-manure"] td').first()).toHaveText("2.42-6.29-2.11");
  await expect(table(page, "balanced").locator('tr[data-row="rice-basal-clay"] th[scope=row]')).toHaveText("16-20-0 / 18-22-0 / 20-20-0");
  await expect(table(page, "urea").locator('tr[data-row="rock-phosphate"] td').first()).toHaveText("P ละลายช้า");
});

test("every cited row links to a source in the list below, with its tier shown", async ({ page }) => {
  await page.goto(ROUTE);
  const cites = page.locator("table.source-table tr[data-row] a[data-cite]");
  const n = await cites.count();
  expect(n, "the pamphlet prints citations beside some of these rows").toBeGreaterThan(5);
  const seen = await cites.evaluateAll((as) => as.map((a) => [a.getAttribute("data-cite"), a.getAttribute("href"), a.querySelector("[data-tier]")?.getAttribute("data-tier")]));
  for (const [id, href, tier] of seen) {
    expect(href).toBe(`#src-${id}`);
    expect(["official", "research", "commercial"], `${id} has a tier`).toContain(tier);
    await expect(page.locator(`#sources li#src-${id}`)).toHaveCount(1);
  }
  // Spot-check which row carries which marker.
  await expect(page.locator('tr[data-row="urea"] a[data-cite]')).toHaveAttribute("data-cite", "phys");
  await expect(page.locator('tr[data-row="slaked-lime"] a[data-cite]')).toHaveCount(2);
  await expect(page.locator('tr[data-row="gypsum"] a[data-cite]')).toHaveCount(0);
});

test("no table, and not the page, scrolls sideways", async ({ page }) => {
  await page.goto(ROUTE);
  const widths = await page.evaluate(() => ({
    page: [document.documentElement.scrollWidth, document.documentElement.clientWidth],
    tables: [...document.querySelectorAll("table.source-table")].map((t) => {
      const fig = t.closest("figure")!;
      return [t.getBoundingClientRect().right, fig.getBoundingClientRect().right, fig.scrollWidth, fig.clientWidth];
    }),
  }));
  expect(widths.page[0]).toBeLessThanOrEqual(widths.page[1]!);
  for (const [tableRight, figRight, scrollW, clientW] of widths.tables) {
    expect(tableRight!, "table inside its figure").toBeLessThanOrEqual(figRight! + 1);
    expect(scrollW!, "figure does not scroll sideways").toBeLessThanOrEqual(clientW! + 1);
  }
});

test("a grade never breaks across lines (no \"18-46-\" over \"0\")", async ({ page }) => {
  await page.goto(ROUTE);
  // A cell's own height follows its row, so count the lines the text itself occupies.
  const lines = (row: string) =>
    page.locator(`tr[data-row="${row}"] td`).first().evaluate((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top))).size;
    });
  for (const row of ["urea", "ammonium-sulfate", "dap", "tsp", "kcl", "sop", "cow-manure", "chicken-manure", "compost"]) {
    expect(await lines(row), `${row}: the grade is on one line`).toBe(1);
  }
});

test("Thai in the four tables has room for stacked vowels and is not clipped", async ({ page }) => {
  await page.goto(ROUTE);
  const cells = await page.locator("table.source-table th, table.source-table td").evaluateAll((els) =>
    els.map((el) => {
      const s = getComputedStyle(el);
      return { text: el.textContent ?? "", ratio: parseFloat(s.lineHeight) / parseFloat(s.fontSize), clipped: el.scrollHeight > el.clientHeight + 1 };
    }),
  );
  expect(cells.length).toBeGreaterThan(60);
  for (const c of cells) {
    expect(c.ratio, c.text).toBeGreaterThanOrEqual(1.7);
    expect(c.clipped, c.text).toBe(false);
  }
});

test("every fertilizer type the lesson promises is named on the chapter", async ({ page }) => {
  await page.goto(ROUTE);
  const body = await page.locator("#content").innerText();
  for (const word of [
    "ยูเรีย", "แอมโมเนียมซัลเฟต", "DAP", "TSP", "หินฟอสเฟต", "KCl", "K₂SO₄", "ปุ๋ยสูตรผสม",
    "ปุ๋ยละลายช้า", "ปุ๋ยทางใบ", "ปูนขาว", "ปูนมาร์ล", "โดโลไมท์", "ยิปซัม",
  ]) {
    expect(body, word).toContain(word);
  }
});

test("the tables are in the server HTML, before any script runs", async ({ request }) => {
  const html = await (await request.get(ROUTE)).text();
  for (const row of ["cow-manure", "urea", "balanced", "gypsum"]) expect(html, row).toContain(`data-row="${row}"`);
  expect(html).toContain("2.42-6.29-2.11");
});

test("no source table other than the six Thai-audience ones can appear on any chapter", async ({ page }) => {
  for (const slug of ["ch01", "ch02", "ch03", "ch04", "ch05", "ch06", "ch07"]) {
    await page.goto(`/th/${slug}`);
    const ids = await page.locator("table tr[data-row]").evaluateAll((trs) => trs.map((t) => t.getAttribute("data-row")));
    for (const id of ids) expect(id, `${slug}`).not.toMatch(/^(khmer|kh-|rice-by-soil|cambodia)/);
    expect(await page.locator("[data-source-table]:not([hidden])").count()).toBe(0);
  }
});
