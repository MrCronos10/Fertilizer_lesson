import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { collectPageProblems } from "./console";

const ROUTE = "/th/ch05";
const SOIL_NOTE = "ควรส่งดินตรวจที่สถานีพัฒนาที่ดินจังหวัดก่อนเติมปุ๋ย";

type G = { scope: string; text: string; actionable: boolean; rate: { min?: number; max?: number; value?: number } | null; unit: string | null };
type Row = { id: string; labels: { th: { crop: string } }; basal: G[]; topDressing: G[] };
// Read straight from the JSON, not through the app's own filters, so this is an independent check.
const ROWS: Row[] = JSON.parse(readFileSync(join(process.cwd(), "content/data/other-crops.json"), "utf8")).rows;
const rowsOf = (...ids: string[]) => ids.map((id) => ROWS.find((r) => r.id === id)!);
const guidance = (rows: Row[]) => rows.flatMap((r) => [...r.basal, ...r.topDressing]);

const CROPS = [
  { label: "ข้าว", id: "rice", rows: rowsOf("rice-clay", "rice-sandy") },
  { label: "ข้าวโพด", id: "maize", rows: rowsOf("maize") },
  { label: "มันสำปะหลัง", id: "cassava", rows: rowsOf("cassava") },
  { label: "อ้อย", id: "sugarcane", rows: rowsOf("sugarcane") },
  { label: "ยางพารา", id: "rubber", rows: rowsOf("rubber-immature", "rubber-tapped") },
  { label: "มะม่วง", id: "mango", rows: rowsOf("mango") },
  { label: "ทุเรียน", id: "durian", rows: rowsOf("durian") },
  { label: "ผัก", id: "vegetables", rows: rowsOf("vegetables") },
];
const shown = (g: G) => g.scope !== "KH";
const range = (g: G) => (g.rate ? ("min" in g.rate && g.rate.min !== undefined ? `${g.rate.min}–${g.rate.max}` : `${g.rate.value}`) : null);

async function open(page: Page) {
  await page.goto(ROUTE, { waitUntil: "networkidle" });
  const group = page.getByRole("group", { name: "เลือกพืช", exact: true });
  await expect(group).toBeVisible();
  return group;
}
const radio = (group: Locator, label: string) => group.getByLabel(label, { exact: true });
const panel = (page: Page) => page.locator(".crop-panel .panel");

test("there are exactly eight crops to choose, rice first and already shown", async ({ page }) => {
  const problems = collectPageProblems(page);
  const group = await open(page);
  await expect(group.getByRole("radio")).toHaveCount(8);
  await expect(group.locator("label")).toHaveText(CROPS.map((c) => c.label));
  await expect(panel(page)).toHaveAttribute("data-crop", "rice");
  expect(problems).toEqual([]);
});

for (const crop of CROPS) {
  test(`${crop.id}: shows exactly the table's non-Cambodian wording, numbers only where actionable`, async ({ page }) => {
    const group = await open(page);
    await radio(group, crop.label).check();
    const p = panel(page);
    await expect(p).toHaveAttribute("data-crop", crop.id);

    const all = guidance(crop.rows).filter(shown);
    await expect(p.locator("[data-guidance]")).toHaveCount(all.length);
    // Per row: two rice rows print the same "Urea 5–10 kg/rai", so each is looked up inside its own row.
    for (const row of crop.rows) {
      const section = p.locator(`[data-row="${row.id}"]`);
      for (const g of guidance([row]).filter(shown)) {
        const item = section.locator(`[data-guidance] .crop-text`, { hasText: g.text }).locator("xpath=..");
        await expect(item, `${row.id}: ${g.text}`).toHaveCount(1);
        await expect(item, g.text).toHaveAttribute("data-actionable", String(g.actionable));
        if (!g.actionable) {
          // Descriptive text carries no structured figure: it cannot read as a recommendation.
          await expect(item.locator("[data-crop-rate], [data-grade]"), g.text).toHaveCount(0);
        } else if (range(g)) {
          await expect(item.locator("[data-crop-rate]"), g.text).toHaveText(range(g)!);
          await expect(item.locator("[data-unit]"), g.text).toHaveText(g.unit!);
        } else {
          await expect(item.locator("[data-crop-rate]"), g.text).toHaveCount(0);
        }
      }
    }

    const reliable = all.some((g) => g.actionable);
    await expect(p).toHaveAttribute("data-reliable", String(reliable));
    if (reliable) {
      // Rows that do have a source (rice, maize, durian, cassava's regional figure) say nothing of the kind.
      const unsourced = crop.rows.filter((r) => !guidance([r]).filter(shown).some((g) => g.actionable)).length;
      await expect(p.locator("[data-no-reliable]")).toHaveCount(unsourced);
    } else {
      await expect(p.locator("[data-no-reliable]")).toHaveCount(crop.rows.length);
      await expect(p.locator("[data-actionable=true]")).toHaveCount(0);
      await expect(p.locator("[data-no-reliable]").first()).toContainText("ยังไม่มีแหล่งที่เชื่อถือได้");
    }
  });
}

test("the soil-test note rides on every crop's panel, once", async ({ page }) => {
  const group = await open(page);
  for (const crop of CROPS) {
    await radio(group, crop.label).check();
    await expect(panel(page).locator('[role="note"]', { hasText: SOIL_NOTE }), crop.id).toHaveCount(1);
  }
});

test("no Cambodian wording or figure is reachable under any crop", async ({ page }) => {
  const group = await open(page);
  const kh = guidance(ROWS).filter((g) => g.scope === "KH").map((g) => g.text);
  expect(kh.length).toBeGreaterThan(0);
  for (const crop of CROPS) {
    await radio(group, crop.label).check();
    const text = await panel(page).innerText();
    for (const k of kh) expect(text, `${crop.id}: ${k}`).not.toContain(k);
    expect(text).not.toContain("KH:");
  }
  expect(await page.locator("[data-source-table]:not([hidden])").count()).toBe(0);
  await expect(page.locator("table")).toHaveCount(0);
});

test("a per-tree rate says per tree; a soil-test rule gets no invented number", async ({ page }) => {
  const group = await open(page);
  await radio(group, "ทุเรียน").check();
  const units = await panel(page).locator("[data-unit]").allInnerTexts();
  expect(units).toEqual(["kg/tree", "kg/tree"]);
  await radio(group, "ข้าวโพด").check();
  await expect(panel(page).locator("[data-crop-rate]")).toHaveCount(0);
  await expect(panel(page)).toContainText("by soil test");
});

test("a change is announced briefly, and the long panel is not itself a live region", async ({ page }) => {
  const group = await open(page);
  const announce = page.locator("[data-announce]");
  await expect(announce).toHaveAttribute("aria-live", "polite");
  await expect(announce).toHaveText("ข้าว");
  await radio(group, "อ้อย").check();
  await expect(announce).toHaveText(/^อ้อย\. ยังไม่มีแหล่งที่เชื่อถือได้/);
  await radio(group, "ทุเรียน").check();
  await expect(announce).toHaveText("ทุเรียน");
  await expect(page.locator(".crop-panel")).not.toHaveAttribute("aria-live", /.+/);
});

test("cassava: the Thai figure is reference text; the one number is labelled, in the source's words, as regional", async ({ page }) => {
  const group = await open(page);
  await radio(group, "มันสำปะหลัง").check();
  const numbers = panel(page).locator("[data-actionable=true]");
  await expect(numbers).toHaveCount(1);
  await expect(numbers).toContainText("CIAT regional guidance");
  await expect(numbers.locator("[data-unit]")).toHaveText("kg/ha");
  await expect(numbers.locator("[data-scope=regional]")).toHaveText("regional");
  // No other crop's figure is called regional.
  await radio(group, "ทุเรียน").check();
  await expect(panel(page).locator("[data-scope]")).toHaveCount(0);
  await radio(group, "มันสำปะหลัง").check();
  await expect(panel(page).locator("[data-actionable=false]", { hasText: "TH: 15-15-15 at 25–50 kg/rai" })).toHaveCount(1);
});

test("each source chip shows a tier; a linked one lands on its entry in the list below; an unlisted one is not a dead link", async ({ page }) => {
  const group = await open(page);
  for (const crop of CROPS) {
    await radio(group, crop.label).check();
    const chips = panel(page).locator(".crop-source");
    const n = await chips.count();
    for (let i = 0; i < n; i++) {
      const chip = chips.nth(i);
      expect(["official", "research", "commercial"], `${crop.id} chip ${i}`).toContain(await chip.locator("[data-tier]").first().getAttribute("data-tier"));
      const link = chip.locator("a[data-cite]");
      if (await link.count()) {
        const id = await link.getAttribute("data-cite");
        expect(await link.getAttribute("href")).toBe(`#src-${id}`);
        await expect(page.locator(`#sources li#src-${id}`), `${crop.id} ${id}`).toHaveCount(1);
      }
    }
  }
  // Cassava's dolomite marker (blogspot) is printed on p5, not here, so it must not link to a missing entry.
  await radio(group, "มันสำปะหลัง").check();
  await expect(panel(page).locator('[data-source="blogspot"] a')).toHaveCount(0);
  await expect(panel(page).locator('[data-source="blogspot"] [data-tier]')).toHaveAttribute("data-tier", "commercial");
});

test("the sources list names no source that no visible figure links to, and not the hidden Cambodian table's", async ({ page }) => {
  const group = await open(page);
  const linked = new Set<string>();
  for (const crop of CROPS) {
    await radio(group, crop.label).check();
    for (const id of await panel(page).locator("a[data-cite]").evaluateAll((as) => as.map((a) => a.getAttribute("data-cite")!))) linked.add(id);
  }
  const listed = await page.locator("#sources li[id^=src-]").evaluateAll((lis) => lis.map((li) => li.id.replace("src-", "")));
  expect(listed.sort()).toEqual([...linked].sort());
  expect(listed).not.toContain("irri");
  expect(listed).not.toContain("cambridge");
});

test("keyboard: arrow keys move through the crops and the panel follows", async ({ page }) => {
  const group = await open(page);
  await radio(group, "ข้าว").focus();
  await page.keyboard.press("ArrowDown");
  await expect(panel(page)).toHaveAttribute("data-crop", "maize");
  await page.keyboard.press("ArrowRight");
  await expect(panel(page)).toHaveAttribute("data-crop", "cassava");
  await page.keyboard.press("ArrowUp");
  await expect(panel(page)).toHaveAttribute("data-crop", "maize");
});

test("a finger tap on a crop selects it", async ({ page }) => {
  test.skip(!test.info().project.use.hasTouch, "needs a touch device");
  const group = await open(page);
  await group.locator("label", { hasText: "ทุเรียน" }).tap();
  await expect(panel(page)).toHaveAttribute("data-crop", "durian");
});

test("every crop choice is at least 44 x 44 and nothing is revealed by hover alone", async ({ page }) => {
  const group = await open(page);
  for (const label of await group.locator("label").all()) {
    const box = (await label.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
  const hover = await page.evaluate(() =>
    [...document.styleSheets].flatMap((s) => [...s.cssRules]).filter((r) => /\.crop|\.def-option|\.def-choice/.test(r.cssText) && /:hover/.test(r.cssText)).length,
  );
  expect(hover).toBe(0);
});

test("the choices and the first crop's panel are in the server HTML; the page does not scroll sideways", async ({ page, request }) => {
  const html = await (await request.get(ROUTE)).text();
  expect((html.match(/type="radio"/g) ?? []).length).toBe(8);
  expect(html).toContain('data-crop="rice"');
  expect(html).toContain("16-20-0, 18-22-0 or 20-20-0, 20–25 kg/rai");
  await page.goto(ROUTE);
  const [sw, cw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(sw).toBeLessThanOrEqual(cw);
});
