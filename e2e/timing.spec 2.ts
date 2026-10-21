import { expect, test, type Page } from "@playwright/test";
import { collectPageProblems } from "./console";

const ROUTE = "/th/ch02";
const svg = (page: Page) => page.locator("svg[data-timing]");
/** SVG <text> has no innerText, so read textContent. */
const texts = (page: Page) => svg(page).locator("text").evaluateAll((els) => els.map((e) => e.textContent ?? ""));

test("the diagram shows both stages, the pamphlet's words, as real SVG text", async ({ page }) => {
  const problems = collectPageProblems(page);
  await page.goto(ROUTE);
  await expect(svg(page)).toBeVisible();
  const basal = svg(page).locator('[data-stage="basal"] text');
  const top = svg(page).locator('[data-stage="topDressing"] text');
  await expect(basal.nth(0)).toHaveText("ปุ๋ยรองพื้น");
  await expect(basal.nth(1)).toHaveText("ใส่ก่อนหรือพร้อมปลูก");
  await expect(basal.nth(2)).toHaveText("เน้น P และ K");
  await expect(basal.nth(3)).toHaveText("เช่น 16-20-0 หรือปุ๋ยคอก");
  await expect(top.nth(0)).toHaveText("ปุ๋ยแต่งหน้า");
  await expect(top.nth(1)).toHaveText("ใส่ระหว่างที่พืชเติบโต");
  await expect(top.nth(2)).toHaveText("เน้น N และแบ่งใส่หลายครั้ง");
  await expect(top.nth(4)).toHaveText("ยูเรียตอนข้าวแตกกอหรือตั้งท้อง");
  expect(problems).toEqual([]);
});

test("the Thai rates are shown with their grades: basal 20–25 kg/rai, urea 5–10 kg/rai, rice only", async ({ page }) => {
  await page.goto(ROUTE);
  const all = await texts(page);
  expect(all.filter((t) => t === "อัตราอ้างอิง 20–25 kg/rai")).toHaveLength(2);
  expect(all.filter((t) => t === "อัตราอ้างอิง 5–10 kg/rai")).toHaveLength(2);
  expect(all).toContain("สูตร 16-20-0 / 18-22-0 / 20-20-0");
  expect(all).toContain("สูตร 46-0-0");
  expect(all.join(" ")).not.toMatch(/kg\/ha|kg\/tree|เขมร|กัมพูชา/);
  // The basal rates sit in the basal panel, the urea rates in the top-dressing panel.
  await expect(svg(page).locator('[data-stage="basal"] text', { hasText: "20–25" })).toHaveCount(2);
  await expect(svg(page).locator('[data-stage="topDressing"] text', { hasText: "5–10" })).toHaveCount(2);
});

test("it is one named image whose description carries every word (the text alternative)", async ({ page }) => {
  await page.goto(ROUTE);
  await expect(svg(page)).toHaveAttribute("role", "img");
  const name = await svg(page).evaluate((el) => {
    const ids = el.getAttribute("aria-labelledby")!.split(" ");
    return ids.map((id) => el.querySelector(`#${id}`)?.textContent ?? "");
  });
  expect(name[0]).toBe("ปุ๋ยรองพื้น / ปุ๋ยแต่งหน้า");
  for (const t of await texts(page)) expect(name[1], t).toContain(t);
});

test("nothing moves, and there is no control to move it", async ({ page }) => {
  await page.goto(ROUTE);
  const found = await page.evaluate(() => {
    const el = document.querySelector("svg[data-timing]")!;
    return {
      animate: el.querySelectorAll("animate, animateTransform, animateMotion, set").length,
      inputs: el.closest("figure")!.querySelectorAll("input, button, [role=slider]").length,
      animations: document.getAnimations().filter((a) => el.contains((a.effect as KeyframeEffect | null)?.target ?? null)).length,
    };
  });
  expect(found).toEqual({ animate: 0, inputs: 0, animations: 0 });
});

test("the soil-test note follows the figure, and sources show a tier", async ({ page }) => {
  await page.goto(ROUTE);
  const block = page.locator(".rate-block", { has: svg(page) });
  await expect(block.locator('[role="note"]')).toHaveText("ควรส่งดินตรวจที่สถานีพัฒนาที่ดินจังหวัดก่อนเติมปุ๋ย");
  await expect(block.locator("figcaption")).toContainText("หน้าในเอกสารต้นฉบับ: 5, 12");
  const tiers = await block.locator("figcaption [data-tier]").evaluateAll((els) => els.map((e) => e.getAttribute("data-tier")));
  expect(tiers.length).toBeGreaterThan(0);
  for (const t of tiers) expect(["official", "research", "commercial"]).toContain(t);
  // FAO's marker is in chapter 2's list, so it links; the named-only sources do not.
  const link = block.locator("figcaption a[data-cite]");
  await expect(link).toHaveAttribute("href", "#src-fao");
  await expect(page.locator("#sources li#src-fao")).toHaveCount(1);
});

test("the text is big enough to read at this screen, and the figure fits without sideways scroll", async ({ page }) => {
  await page.goto(ROUTE);
  const sizes = await svg(page).evaluate((el) => {
    const scale = el.getBoundingClientRect().width / (el as unknown as SVGSVGElement).viewBox.baseVal.width;
    return [...el.querySelectorAll("text")].map((t) => parseFloat(getComputedStyle(t).fontSize) * scale);
  });
  for (const s of sizes) expect(s).toBeGreaterThanOrEqual(13);
  const [sw, cw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(sw).toBeLessThanOrEqual(cw);
});

test("no text is clipped: every line sits inside its panel", async ({ page }) => {
  await page.goto(ROUTE);
  const bad = await svg(page).evaluate((el) =>
    [...el.querySelectorAll("g[data-stage]")].flatMap((g) => {
      const box = g.querySelector("rect")!.getBBox();
      return [...g.querySelectorAll("text")]
        .filter((t) => {
          const b = t.getBBox();
          return b.x < box.x || b.x + b.width > box.x + box.width || b.y < box.y || b.y + b.height > box.y + box.height;
        })
        .map((t) => t.textContent);
    }),
  );
  expect(bad).toEqual([]);
});

test("it follows the theme: text is readable on the panel in light and dark", async ({ page }) => {
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto(ROUTE);
    const colours = await svg(page).evaluate((el) => {
      const rgb = (s: string) => (s.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
      const lum = ([r, g, b]: number[]) => {
        const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
        return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!);
      };
      const box = rgb(getComputedStyle(el.querySelector("rect")!).fill);
      const out: number[] = [];
      for (const t of el.querySelectorAll("text")) {
        const [a, b] = [lum(rgb(getComputedStyle(t).fill)), lum(box)];
        out.push((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05));
      }
      return out;
    });
    for (const c of colours) expect(c, scheme).toBeGreaterThanOrEqual(4.5);
  }
});

test("the diagram is in the server HTML", async ({ request }) => {
  const html = await (await request.get(ROUTE)).text();
  expect(html).toContain("data-timing");
  expect(html).toContain("ใส่ก่อนหรือพร้อมปลูก");
});
