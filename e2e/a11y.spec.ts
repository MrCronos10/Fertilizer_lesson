import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { ROUTES } from "../lib/budget";

/**
 * T-025: axe over every route and every interactive state, in light and dark. "Zero violations"
 * means the default rule set (WCAG 2.0/2.1/2.2 A and AA plus axe's best practices), with nothing
 * disabled and nothing excluded. Each state a reader can reach is swept, not just the page as it
 * loads, because a result panel, an error message or an open answer can introduce a violation the
 * resting page does not have.
 */
const SCHEMES = ["light", "dark"] as const;

async function sweep(page: Page, label: string) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  const summary = violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length}× e.g. ${v.nodes[0]?.target.join(" ")} — ${v.help}`);
  expect(summary, `axe violations: ${label}`).toEqual([]);
}

type State = { name: string; route: string; prepare?: (page: Page) => Promise<void> };

const crops = ["ข้าว", "ข้าวโพด", "มันสำปะหลัง", "อ้อย", "ยางพารา", "มะม่วง", "ทุเรียน", "ผัก"];

const STATES: State[] = [
  ...ROUTES.map((r) => ({
    name: `${r.path} as it loads${r.path === "/th/ch01" ? " (plant scrolled into view and drawn)" : ""}`,
    route: r.path,
    prepare: r.path === "/th/ch01"
      ? async (page: Page) => {
          await page.locator(".deficiency").scrollIntoViewIfNeeded();
          await expect(page.locator(".scene3d canvas:visible")).toBeVisible();
        }
      : undefined,
  })),
  ...["ใบอ่อน/ยอด", "เอกสารไม่ระบุตำแหน่งใบ"].map((label) => ({
    name: `ch01, deficiency choice "${label}"`,
    route: "/th/ch01",
    prepare: async (page: Page) => {
      await page.locator(".deficiency").scrollIntoViewIfNeeded();
      await page.getByRole("group", { name: "เลือกตำแหน่งใบ" }).getByLabel(label, { exact: true }).check();
    },
  })),
  {
    name: "ch03, calculator with a result and its working",
    route: "/th/ch03",
    prepare: async (page) => {
      const calc = page.locator("section.calculator");
      await calc.getByLabel("ปริมาณธาตุที่ต้องการ (กก./ไร่)").fill("10");
      await calc.getByLabel("เลือกสูตรที่มีในเอกสาร").selectOption({ label: "46-0-0 ยูเรีย" });
      await calc.getByRole("button", { name: "คำนวณ" }).click();
      await expect(calc.getByRole("status")).toContainText("≈ 22");
    },
  },
  {
    name: "ch03, calculator with every error showing",
    route: "/th/ch03",
    prepare: async (page) => {
      const calc = page.locator("section.calculator");
      await calc.getByRole("button", { name: "คำนวณ" }).click();
      await expect(calc.getByRole("alert").first()).toBeVisible();
    },
  },
  ...["N", "P₂O₅", "K₂O"].map((n) => ({
    name: `ch03, bag reader on ${n}`,
    route: "/th/ch03",
    prepare: async (page: Page) => {
      await page.locator("label.bag-tile", { has: page.getByRole("radio", { name: new RegExp(`^${n}`) }) }).click();
    },
  })),
  ...crops.map((c) => ({
    name: `ch05, crop matcher on ${c}`,
    route: "/th/ch05",
    prepare: async (page: Page) => {
      await page.getByRole("group", { name: "เลือกพืช" }).getByLabel(c, { exact: true }).check();
    },
  })),
  {
    name: "ch07, quiz with an answer open and marked",
    route: "/th/ch07",
    prepare: async (page) => {
      // One question at a time (T-053): move to the fourth, mark it right, then the fifth, mark it not yet.
      const next = page.getByRole("button", { name: "ข้อถัดไป" });
      for (let n = 0; n < 3; n++) await next.click();
      const item = page.locator('.quiz-item[data-question="3"]');
      await item.getByRole("button", { name: "ดูคำตอบ" }).click();
      await item.getByRole("button", { name: "ตอบถูก", exact: true }).click();
      await next.click();
      await page.locator('.quiz-item[data-question="4"]').getByRole("button", { name: "ดูคำตอบ" }).click();
      await page.locator('.quiz-item[data-question="4"]').getByRole("button", { name: "ยังไม่ถูก", exact: true }).click();
    },
  },
  {
    name: "3D specimen with WebGL unavailable (fallback shown)",
    route: "/specimen-3d",
    prepare: undefined,
  },
];

for (const scheme of SCHEMES) {
  test.describe(`axe, ${scheme} theme`, () => {
    test.use({ colorScheme: scheme });
    for (const state of STATES) {
      test(`zero violations: ${state.name}`, async ({ page }) => {
        if (state.name.includes("WebGL unavailable")) {
          await page.addInitScript(() => {
            const original = HTMLCanvasElement.prototype.getContext;
            HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
              if (/webgl/.test(type)) return null;
              return (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
            } as typeof original;
          });
        }
        await page.goto(state.route, { waitUntil: "networkidle" });
        await state.prepare?.(page);
        await sweep(page, `${state.name} (${scheme})`);
      });
    }
  });
}
