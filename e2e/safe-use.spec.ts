import { expect, test, type Page } from "@playwright/test";
import { collectPageProblems } from "./console";

const section = (page: Page, id: string) => page.locator(`section[data-section="${id}"]`);

test("chapter 4 shows its five blocks in the source's order, each naming page 6", async ({ page }) => {
  const problems = collectPageProblems(page);
  await page.goto("/th/ch04");
  const ids = await page.locator("section[data-section]").evaluateAll((els) => els.map((e) => e.getAttribute("data-section")));
  expect(ids).toEqual(["four-r", "practice", "safety", "mistakes", "environment"]);
  for (const id of ids) {
    await expect(section(page, id!)).toHaveAttribute("data-source-page", "6");
    await expect(section(page, id!).locator(".chapter-section-page")).toHaveText("หน้าในเอกสารต้นฉบับ: 6");
  }
  expect(problems).toEqual([]);
});

test("4R is presented exactly as the pamphlet words it", async ({ page }) => {
  await page.goto("/th/ch04");
  await expect(section(page, "four-r")).toContainText("หลัก 4 ถูก (4R): ถูกชนิด ถูกอัตรา ถูกเวลา และถูกที่");
});

test("all six common mistakes are there, one list item each, in order", async ({ page }) => {
  await page.goto("/th/ch04");
  const items = section(page, "mistakes").locator("ul ul > li");
  await expect(items).toHaveCount(6);
  await expect(items.nth(0)).toHaveText("ใส่มากจนปุ๋ยไหม้");
  await expect(items.nth(1)).toContainText("โรยยูเรียทิ้งบนผิวดิน");
  await expect(items.nth(1)).toContainText("MSU Extension EB0209");
  await expect(items.nth(1)).toContainText("30–44%");
  await expect(items.nth(2)).toHaveText("ใส่ N ครั้งเดียว");
  await expect(items.nth(3)).toHaveText("ไม่แก้ดินกรด");
  await expect(items.nth(4)).toHaveText("เผาฟาง");
  await expect(items.nth(5)).toHaveText('ซื้อ "ปุ๋ยวิเศษ"');
});

test("safety, storage and the environment caution are present and marked as warnings", async ({ page }) => {
  await page.goto("/th/ch04");
  await expect(section(page, "safety")).toContainText("สวมถุงมือและหน้ากาก เก็บปุ๋ยในที่แห้งบนแคร่ ห่างอาหาร เด็ก สัตว์ และเชื้อเพลิง ปิดถุงยูเรียให้สนิทเพราะดูดความชื้น");
  await expect(section(page, "environment")).toContainText("สาหร่ายบลูมและปลาตาย อย่าใส่ปุ๋ยหรือล้างภาชนะใส่ปุ๋ยใกล้บ่อ คลอง หรือบ่อน้ำดื่ม");
  for (const id of ["safety", "mistakes", "environment"]) await expect(section(page, id)).toHaveClass(/chapter-section-warn/);
  await expect(section(page, "four-r")).not.toHaveClass(/chapter-section-warn/);
});

test("the two markers the pamphlet prints are cited and land on the sources list", async ({ page }) => {
  await page.goto("/th/ch04");
  const cites = page.locator("#content a[data-cite]");
  await expect(cites).toHaveCount(2);
  for (const id of ["fao", "oae"]) {
    await expect(page.locator(`section[data-section="practice"] a[data-cite="${id}"]`)).toHaveAttribute("href", `#src-${id}`);
    await expect(page.locator(`#sources li#src-${id}`)).toHaveCount(1);
    await expect(page.locator(`section[data-section="practice"] a[data-cite="${id}"] [data-tier]`)).toHaveAttribute("data-tier", /official|research|commercial/);
  }
});

test("a block with no outside source says so; the block that has printed markers does not", async ({ page }) => {
  await page.goto("/th/ch04");
  const note = "เอกสารต้นฉบับไม่ได้ระบุแหล่งอ้างอิงภายนอกสำหรับข้อความนี้";
  for (const id of ["four-r", "safety", "mistakes", "environment"]) await expect(section(page, id).locator("[data-uncited]")).toHaveText(note);
  await expect(section(page, "practice").locator("[data-uncited]")).toHaveCount(0);
});

test("no prose sits outside a block that names its page", async ({ page }) => {
  await page.goto("/th/ch04");
  const stray = await page.evaluate(() => {
    const article = document.querySelector("article")!;
    return [...article.children]
      // The redesign's header band and sources bar (T-048) carry no prose of their own.
      .filter((el) => !el.matches("section[data-section], h1, nav, a.jump-sources, div.jump-sources, header.chapter-band, #sources"))
      .map((el) => `${el.tagName} ${(el.textContent ?? "").slice(0, 40)}`);
  });
  expect(stray).toEqual([]);
});

test("chapter 7's summary is one block of six numbered points on page 6, followed by the quiz", async ({ page }) => {
  await page.goto("/th/ch07", { waitUntil: "networkidle" });
  const summary = section(page, "summary");
  await expect(summary).toHaveAttribute("data-source-page", "6");
  await expect(summary.locator("ol > li")).toHaveCount(6);
  await expect(summary.locator("[data-uncited]")).toHaveCount(1);
  await expect(summary.locator("ol > li").nth(3)).toHaveText("กลบยูเรียทุกครั้ง");
  await expect(summary.locator("ol > li").nth(5)).toHaveText("ตรวจดินทุก 3 ปี");
  await expect(page.locator(".quiz-item")).toHaveCount(6);
});

test("the blocks are in the server HTML and fit the screen without sideways scroll", async ({ page, request }) => {
  const html = await (await request.get("/th/ch04")).text();
  for (const id of ["four-r", "practice", "safety", "mistakes", "environment"]) expect(html).toContain(`data-section="${id}"`);
  await page.goto("/th/ch04");
  const [sw, cw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(sw).toBeLessThanOrEqual(cw);
});

test("warning blocks stay readable in light and dark (text 4.5:1 on the block)", async ({ page }) => {
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/th/ch04");
    const ratios = await page.evaluate(() => {
      const rgb = (s: string) => (s.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
      const lum = ([r, g, b]: number[]) => {
        const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
        return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!);
      };
      return [...document.querySelectorAll(".chapter-section-warn")].map((el) => {
        const a = lum(rgb(getComputedStyle(el.querySelector("li")!).color));
        const b = lum(rgb(getComputedStyle(el).backgroundColor));
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      });
    });
    expect(ratios).toHaveLength(3);
    for (const r of ratios) expect(r, scheme).toBeGreaterThanOrEqual(4.5);
  }
});
