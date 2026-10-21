import { expect, test } from "@playwright/test";
import { collectPageProblems } from "./console";

const ROWS = [
  {
    id: "macronutrients",
    group: "ธาตุอาหารหลัก (Macronutrients)",
    elements: "N, P, K",
    role: "N = ใบเขียว โตเร็ว; P = ราก ดอก เมล็ด; K = ผลโต หวาน ต้นแข็ง ทนโรค",
  },
  {
    id: "secondary",
    group: "ธาตุอาหารรอง (Secondary)",
    elements: "Ca, Mg, S",
    role: "Ca = ผนังเซลล์ ปลายราก; Mg = ใจกลางคลอโรฟิลล์; S = โปรตีน กลิ่นรส",
  },
  {
    id: "micronutrients",
    group: "จุลธาตุ (Micronutrients)",
    elements: "Fe, Zn, B, Mn, Cu, Mo, Cl, Ni",
    role: "ใช้น้อยมากแต่ขาดไม่ได้ เช่น B ช่วยผสมเกสร",
  },
];

test("the p2 table renders its three rows from the data, with headers", async ({ page }) => {
  const problems = collectPageProblems(page);
  await page.goto("/th/ch01");
  const table = page.locator("table.source-table");
  await expect(table).toHaveCount(1);
  await expect(table.locator("thead th")).toHaveText(["กลุ่ม", "ธาตุ", "หน้าที่ (จำง่าย)"]);
  await expect(table.locator("tbody tr")).toHaveCount(3);
  for (const row of ROWS) {
    const tr = table.locator(`tr[data-row="${row.id}"]`);
    await expect(tr.locator("th[scope=row]")).toHaveText(row.group);
    await expect(tr.locator("td").first()).toHaveText(row.elements);
    await expect(tr.locator("td").last()).toHaveText(row.role);
  }
  await expect(page.locator("figcaption")).toContainText("หน้าในเอกสารต้นฉบับ: 2");
  expect(problems).toEqual([]);
});

test("only the nutrient-group table renders: the symptom table waits for its own ticket", async ({ page }) => {
  await page.goto("/th/ch01");
  await expect(page.locator("table")).toHaveCount(1);
});

test("the nums block lists three figures, each linking to a listed source", async ({ page }) => {
  await page.goto("/th/ch01");
  const nums = page.locator("aside.nums");
  await expect(nums.getByRole("heading", { level: 2 })).toHaveText("ตัวเลขที่ใช้ในบทนี้ (จากเอกสาร)");
  await expect(nums.locator("li")).toHaveCount(3);
  await expect(nums).toContainText("พ.ร.บ.ปุ๋ย พ.ศ. 2518");
  // Which source sits on which figure, and the overflow count, not just that links resolve.
  const cites = await nums.locator("li").evaluateAll((lis) => lis.map((li) => li.querySelector("a[data-cite]")?.getAttribute("data-cite")));
  expect(cites).toEqual(["doa", "uga", "uga"]);
  await expect(nums.locator("li").nth(0)).not.toContainText("+2");
  await expect(nums.locator("li").nth(1)).toContainText("+2");
  await expect(nums.locator("li").nth(2)).toContainText("+2");
  for (const href of await nums.locator("a[data-cite]").evaluateAll((as) => as.map((a) => a.getAttribute("href")))) {
    await expect(page.locator(`#sources li${href}`)).toHaveCount(1);
  }
});

test("Thai in the table has room for stacked vowels and tone marks, and is not clipped", async ({ page }) => {
  await page.goto("/th/ch01");
  const cells = await page.locator("table.source-table th, table.source-table td").evaluateAll((els) =>
    els.map((el) => {
      const s = getComputedStyle(el);
      return {
        text: el.textContent ?? "",
        ratio: parseFloat(s.lineHeight) / parseFloat(s.fontSize),
        clipped: el.scrollHeight > el.clientHeight + 1,
        family: s.fontFamily,
      };
    }),
  );
  expect(cells.length).toBe(3 + 9);
  for (const c of cells) {
    expect(c.ratio, c.text).toBeGreaterThanOrEqual(1.7);
    expect(c.clipped, c.text).toBe(false);
  }
  // The faces really are loaded for the Thai on screen, not a fallback.
  const loaded = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.querySelectorAll("table.source-table td, table.source-table th")].map((el) =>
      document.fonts.check(`16px ${getComputedStyle(el).fontFamily}`, el.textContent ?? ""),
    );
  });
  expect(loaded.every(Boolean)).toBe(true);
});

test("no horizontal scroll at the project viewport or at phone width", async ({ page }) => {
  await page.goto("/th/ch01");
  const overflow = () =>
    page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(await overflow()).toBeLessThanOrEqual(0);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await overflow()).toBeLessThanOrEqual(0);
});

for (const scheme of ["light", "dark"] as const) {
  test(`table text is legible in ${scheme}`, async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: scheme });
    const page = await context.newPage();
    await page.goto("/th/ch01");
    const rgb = (value: string) => value.match(/[\d.]+/g)!.map(Number);
    const lum = ([r, g, b]: number[]) => {
      const f = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!);
    };
    const ratio = (a: number[], b: number[]) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
      return (hi! + 0.05) / (lo! + 0.05);
    };
    const bg = rgb(await page.evaluate(() => getComputedStyle(document.body).backgroundColor));
    const { text, header } = await page.evaluate(() => {
      const td = document.querySelector("table.source-table td")!;
      const th = document.querySelector("table.source-table thead th")!;
      return { text: getComputedStyle(td).color, header: [getComputedStyle(th).color, getComputedStyle(th).backgroundColor] };
    });
    expect(ratio(rgb(text), bg)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(rgb(header[0]!), rgb(header[1]!))).toBeGreaterThanOrEqual(4.5);
    await context.close();
  });
}

test.describe("with JavaScript disabled", () => {
  test.use({ javaScriptEnabled: false });

  test("the whole lesson text, the table and the figures are already in the page", async ({ page }) => {
    await page.goto("/th/ch01");
    const body = page.locator("#content");
    await expect(body).toContainText("อาหารของพืช");
    await expect(body).toContainText("ธาตุที่เคลื่อนที่ได้ในพืช");
    await expect(body).toContainText("ส่งดินตรวจ");
    await expect(page.locator("table.source-table tbody tr")).toHaveCount(3);
    await expect(page.locator("aside.nums li")).toHaveCount(3);
    await expect(page.locator("#sources")).toBeVisible();
  });
});
