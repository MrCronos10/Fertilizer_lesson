import { expect, test, type Page } from "@playwright/test";
import { collectPageProblems } from "./console";

const TARGET = "ปริมาณธาตุที่ต้องการ (กก./ไร่)";

async function open(page: Page) {
  // networkidle: the form hydrates from its own lazy chunk, and typing before that lands
  // can be overwritten by hydration. That is a test race, not something a person trips on.
  await page.goto("/th/ch03", { waitUntil: "networkidle" });
  const calc = page.locator("section.calculator");
  await expect(calc).toBeVisible();
  return calc;
}

test("the calculator hydrates with no console errors and exposes labelled controls", async ({ page }) => {
  const problems = collectPageProblems(page);
  const calc = await open(page);
  await expect(calc.getByRole("heading", { level: 2, name: "คำนวณปริมาณปุ๋ย" })).toBeVisible();
  await expect(calc.getByRole("group", { name: "ธาตุที่ต้องการ" })).toBeVisible();
  for (const name of ["N", "P₂O₅", "K₂O"]) await expect(calc.getByRole("radio", { name })).toHaveCount(1);
  await expect(calc.getByLabel(TARGET)).toBeVisible();
  await expect(calc.getByRole("group", { name: "สูตร (ตัวเลข 3 ตัวบนกระสอบ)" })).toBeVisible();
  await expect(calc.getByLabel("เลือกสูตรที่มีในเอกสาร")).toBeVisible();
  for (const name of ["N (%)", "P₂O₅ (%)", "K₂O (%)"]) await expect(calc.getByLabel(name)).toBeVisible();
  await expect(calc.getByRole("button", { name: "คำนวณ" })).toBeVisible();
  expect(problems).toEqual([]);
});

test("the source's worked example: N 10 kg/rai from urea 46-0-0 is 10 × 100 ÷ 46 ≈ 22 kg", async ({ page }) => {
  const calc = await open(page);
  await calc.getByLabel(TARGET).fill("10");
  await calc.getByLabel("เลือกสูตรที่มีในเอกสาร").selectOption({ label: "46-0-0 ยูเรีย" });
  await expect(calc.getByLabel("N (%)")).toHaveValue("46");
  await expect(calc.getByLabel("P₂O₅ (%)")).toHaveValue("0");
  await calc.getByRole("button", { name: "คำนวณ" }).click();

  const result = calc.getByRole("status");
  await expect(result).toContainText("ให้ใช้ ≈ 22 กก. ต่อไร่");
  await expect(result).toContainText("10 × 100 ÷ 46 ≈ 22 กก.");
  // The arithmetic is shown, not just the answer.
  await expect(result.locator("ol li")).toHaveText(["10 × 100 = 1,000", "1,000 ÷ 46 = 21.74", "21.74 ≈ 22"]);
  for (const li of await result.locator("ol li").all()) await expect(li).toBeVisible();
  await expect(result.getByRole("note")).toBeVisible();
  // The soil-test note and its page citation travel with the result.
  await expect(result.getByRole("note")).toHaveText("ควรส่งดินตรวจที่สถานีพัฒนาที่ดินจังหวัดก่อนเติมปุ๋ย");
  await expect(result).toContainText("หน้าในเอกสารต้นฉบับ: 3, 6");
});

test("a free-entry grade works the same, and Thai digits are accepted", async ({ page }) => {
  const calc = await open(page);
  await calc.getByRole("radio", { name: "P₂O₅" }).check();
  await calc.getByLabel(TARGET).fill("๑๐");
  await calc.getByLabel("N (%)").fill("16");
  await calc.getByLabel("P₂O₅ (%)").fill("20");
  await calc.getByLabel("K₂O (%)").fill("0");
  await calc.getByRole("button", { name: "คำนวณ" }).click();
  await expect(calc.getByRole("status")).toContainText("ให้ใช้ ≈ 50 กก. ต่อไร่"); // 10 × 100 ÷ 20
});

test("Enter in a field submits, so the iPad keypad's Go key works", async ({ page }) => {
  const calc = await open(page);
  await calc.getByLabel("เลือกสูตรที่มีในเอกสาร").selectOption({ label: "46-0-0 ยูเรีย" });
  await calc.getByLabel(TARGET).fill("10");
  await calc.getByLabel(TARGET).press("Enter");
  await expect(calc.getByRole("status")).toContainText("≈ 22");
});

test("editing anything clears the old answer rather than leaving a stale dose", async ({ page }) => {
  const calc = await open(page);
  await calc.getByLabel("เลือกสูตรที่มีในเอกสาร").selectOption({ label: "46-0-0 ยูเรีย" });
  await calc.getByLabel(TARGET).fill("10");
  await calc.getByRole("button", { name: "คำนวณ" }).click();
  await expect(calc.getByRole("status")).toContainText("≈ 22");
  await calc.getByLabel(TARGET).fill("20");
  await expect(calc.getByRole("status")).not.toContainText("≈");
  await calc.getByRole("button", { name: "คำนวณ" }).click();
  await expect(calc.getByRole("status")).toContainText("≈ 43");
});

test("typing in a grade field returns the picker to free entry", async ({ page }) => {
  const calc = await open(page);
  const pick = calc.getByLabel("เลือกสูตรที่มีในเอกสาร");
  await pick.selectOption({ label: "46-0-0 ยูเรีย" });
  await calc.getByLabel("N (%)").fill("45");
  await expect(pick).toHaveValue("");
});

test.describe("invalid input gets a clear Thai message, never a crash or NaN", () => {
  const cases: { name: string; setup: (c: ReturnType<Page["locator"]>) => Promise<void>; message: string; flagged: string }[] = [
    { name: "empty target", setup: async () => {}, message: "กรอกปริมาณธาตุที่ต้องการ", flagged: TARGET },
    {
      name: "negative target",
      setup: async (c) => {
        await c.getByLabel(TARGET).fill("-5");
        await c.getByLabel("เลือกสูตรที่มีในเอกสาร").selectOption({ label: "46-0-0 ยูเรีย" });
      },
      message: "กรอกปริมาณเป็นตัวเลขที่ไม่ติดลบ",
      flagged: TARGET,
    },
    {
      name: "text target",
      setup: async (c) => {
        await c.getByLabel(TARGET).fill("สิบ");
        await c.getByLabel("เลือกสูตรที่มีในเอกสาร").selectOption({ label: "46-0-0 ยูเรีย" });
      },
      message: "กรอกเป็นตัวเลข โดยใช้จุด (.) เป็นทศนิยม",
      flagged: TARGET,
    },
    {
      name: "a comma instead of a point",
      setup: async (c) => {
        await c.getByLabel(TARGET).fill("1,5");
        await c.getByLabel("เลือกสูตรที่มีในเอกสาร").selectOption({ label: "46-0-0 ยูเรีย" });
      },
      message: "กรอกเป็นตัวเลข โดยใช้จุด (.) เป็นทศนิยม",
      flagged: TARGET,
    },
    {
      name: "grade left blank",
      setup: async (c) => {
        await c.getByLabel(TARGET).fill("10");
      },
      message: "กรอกตัวเลขสูตรให้ครบทั้ง 3 ช่อง",
      flagged: "N (%)",
    },
    {
      name: "a grade totalling over 100",
      setup: async (c) => {
        await c.getByLabel(TARGET).fill("10");
        await c.getByLabel("N (%)").fill("60");
        await c.getByLabel("P₂O₅ (%)").fill("30");
        await c.getByLabel("K₂O (%)").fill("20");
      },
      message: "ตัวเลขสูตรต้องไม่ติดลบ และรวมกันไม่เกิน 100",
      flagged: "N (%)",
    },
    {
      name: "a 0% nutrient (P₂O₅ from urea)",
      setup: async (c) => {
        await c.getByRole("radio", { name: "P₂O₅" }).check();
        await c.getByLabel(TARGET).fill("10");
        await c.getByLabel("เลือกสูตรที่มีในเอกสาร").selectOption({ label: "46-0-0 ยูเรีย" });
      },
      message: "สูตรนี้ไม่มีธาตุที่เลือก (0%) จึงคำนวณไม่ได้",
      flagged: "P₂O₅ (%)",
    },
  ];

  for (const c of cases) {
    test(c.name, async ({ page }) => {
      const problems = collectPageProblems(page);
      const calc = await open(page);
      await c.setup(calc);
      await calc.getByRole("button", { name: "คำนวณ" }).click();
      await expect(calc.getByRole("alert")).toHaveText(c.message);
      await expect(calc.getByLabel(c.flagged)).toHaveAttribute("aria-invalid", "true");
      // The invalid field is tied to the message for screen readers.
      const alertId = await calc.getByRole("alert").getAttribute("id");
      expect(alertId).toBeTruthy();
      await expect(calc.getByLabel(c.flagged)).toHaveAttribute("aria-describedby", alertId!);
      // The cursor lands on the first thing to fix.
      await expect(calc.getByLabel(c.flagged)).toBeFocused();
      // Not colour alone: a flagged field also gets a heavier border than its neighbours.
      await expect(calc.getByLabel(c.flagged)).toHaveCSS("border-top-width", "2px");
      await expect(calc.getByLabel(TARGET === c.flagged ? "N (%)" : TARGET)).toHaveCSS("border-top-width", "1px");
      await expect(calc.getByRole("status")).toBeEmpty();
      const text = await page.locator("main").innerText();
      for (const bad of ["NaN", "Infinity", "undefined", "null"]) expect(text, bad).not.toContain(bad);
      expect(problems).toEqual([]);
    });
  }

  test("an error clears once the input is fixed and the answer is shown", async ({ page }) => {
    const calc = await open(page);
    await calc.getByRole("button", { name: "คำนวณ" }).click();
    await expect(calc.getByRole("alert")).toHaveText("กรอกปริมาณธาตุที่ต้องการ");
    await calc.getByLabel(TARGET).fill("10");
    await calc.getByLabel("เลือกสูตรที่มีในเอกสาร").selectOption({ label: "46-0-0 ยูเรีย" });
    await expect(calc.getByRole("alert")).toBeEmpty();
    await calc.getByRole("button", { name: "คำนวณ" }).click();
    await expect(calc.getByRole("alert")).toBeEmpty();
    await expect(calc.getByRole("status")).toContainText("≈ 22");
  });
});

test("the result is announced: a polite, atomic live region that exists before it fills", async ({ page }) => {
  const calc = await open(page);
  const status = calc.getByRole("status");
  await expect(status).toHaveAttribute("aria-live", "polite");
  await expect(status).toHaveAttribute("aria-atomic", "true");
  await expect(status).toBeEmpty();
  const display = await status.evaluate((el) => getComputedStyle(el).display);
  expect(display).not.toBe("none");
  await expect(calc.getByRole("alert")).toHaveCount(1);
});

test("every control is at least 44×44, and numbers raise the decimal keypad", async ({ page }) => {
  const calc = await open(page);
  const controls = calc.locator("input[type=text], select, button, label.calc-choice");
  expect(await controls.count()).toBeGreaterThanOrEqual(9);
  for (const control of await controls.all()) {
    const box = await control.boundingBox();
    const name = (await control.evaluate((el) => el.outerHTML)).slice(0, 80);
    expect(box?.height ?? 0, name).toBeGreaterThanOrEqual(44);
    expect(box?.width ?? 0, name).toBeGreaterThanOrEqual(44);
  }
  for (const label of [TARGET, "N (%)", "P₂O₅ (%)", "K₂O (%)"]) {
    await expect(calc.getByLabel(label)).toHaveAttribute("inputmode", "decimal");
  }
});

test("fully operable from the keyboard", async ({ page }) => {
  const calc = await open(page);
  // Radios: arrow keys move the selection within the group.
  await calc.getByRole("radio", { name: "N" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(calc.getByRole("radio", { name: "P₂O₅" })).toBeChecked();
  await page.keyboard.press("ArrowLeft");
  await expect(calc.getByRole("radio", { name: "N" })).toBeChecked();
  // Type a target, choose a grade with the keyboard, and activate the button with Space.
  await calc.getByLabel(TARGET).focus();
  await page.keyboard.type("10");
  await calc.getByLabel("เลือกสูตรที่มีในเอกสาร").selectOption({ label: "46-0-0 ยูเรีย" });
  await calc.getByRole("button", { name: "คำนวณ" }).focus();
  await page.keyboard.press("Space");
  await expect(calc.getByRole("status")).toContainText("≈ 22");
  // A visible focus ring on the focused control (never removed).
  await calc.getByLabel(TARGET).focus();
  const outline = await calc.getByLabel(TARGET).evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe("none");
});

test("the picker offers exactly the source's grades, in table order", async ({ page }) => {
  const calc = await open(page);
  const options = await calc.getByLabel("เลือกสูตรที่มีในเอกสาร").locator("option").allTextContents();
  expect(options).toEqual([
    "กรอกเอง",
    "46-0-0 ยูเรีย",
    "21-0-0 แอมโมเนียมซัลเฟต",
    "18-46-0 DAP",
    "0-46-0 TSP",
    "0-0-60 KCl",
    "0-0-50 K₂SO₄",
    "15-15-15",
    "16-16-16",
    "16-20-0",
    "18-22-0",
    "20-20-0",
    "16-16-8",
    "18-12-6",
    "16-8-8",
    "15-7-18",
    "13-13-21",
    "20-8-20",
    "20-10-12",
    "8-24-24",
    "12-24-12",
  ]);
});

test("fits at the project viewport and at phone width without horizontal scroll", async ({ page }) => {
  const calc = await open(page);
  await calc.getByLabel(TARGET).fill("10");
  await calc.getByLabel("เลือกสูตรที่มีในเอกสาร").selectOption({ label: "46-0-0 ยูเรีย" });
  await calc.getByRole("button", { name: "คำนวณ" }).click();
  const overflow = () =>
    page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(await overflow()).toBeLessThanOrEqual(0);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await overflow()).toBeLessThanOrEqual(0);
});

test("only chapter 3 carries the calculator", async ({ request }) => {
  for (const slug of ["ch01", "ch02", "ch04", "ch05", "ch06", "ch07"]) {
    expect(await (await request.get(`/th/${slug}`)).text(), slug).not.toContain("calc-form");
  }
  expect(await (await request.get("/th/ch03")).text()).toContain("calc-form");
});

test("a grade that adds to more than 100 flags all three grade fields, and not the amount", async ({ page }) => {
  const calc = await open(page);
  await calc.getByLabel(TARGET).fill("10");
  await calc.getByLabel("N (%)").fill("60");
  await calc.getByLabel("P₂O₅ (%)").fill("30");
  await calc.getByLabel("K₂O (%)").fill("20");
  await calc.getByRole("button", { name: "คำนวณ" }).click();
  for (const name of ["N (%)", "P₂O₅ (%)", "K₂O (%)"]) {
    await expect(calc.getByLabel(name), name).toHaveAttribute("aria-invalid", "true");
  }
  await expect(calc.getByLabel(TARGET)).not.toHaveAttribute("aria-invalid", "true");
});

test.describe("any change clears the old answer, whichever control made it", () => {
  async function answered(page: Page) {
    const calc = await open(page);
    await calc.getByLabel("เลือกสูตรที่มีในเอกสาร").selectOption({ label: "46-0-0 ยูเรีย" });
    await calc.getByLabel(TARGET).fill("10");
    await calc.getByRole("button", { name: "คำนวณ" }).click();
    await expect(calc.getByRole("status")).toContainText("≈ 22");
    return calc;
  }

  test("the nutrient choice (a P₂O₅ answer must never sit under an N answer)", async ({ page }) => {
    const calc = await answered(page);
    await calc.getByRole("radio", { name: "P₂O₅" }).check();
    await expect(calc.getByRole("status")).toBeEmpty();
  });

  test("a grade field", async ({ page }) => {
    const calc = await answered(page);
    await calc.getByLabel("N (%)").fill("21");
    await expect(calc.getByRole("status")).toBeEmpty();
  });

  test("the picker", async ({ page }) => {
    const calc = await answered(page);
    await calc.getByLabel("เลือกสูตรที่มีในเอกสาร").selectOption({ label: "21-0-0 แอมโมเนียมซัลเฟต" });
    await expect(calc.getByRole("status")).toBeEmpty();
  });
});

test("submitting the same inputs again replaces the answer, so a screen reader announces it again", async ({ page }) => {
  const calc = await open(page);
  await calc.getByLabel("เลือกสูตรที่มีในเอกสาร").selectOption({ label: "46-0-0 ยูเรีย" });
  await calc.getByLabel(TARGET).fill("10");
  const button = calc.getByRole("button", { name: "คำนวณ" });
  await button.click();
  const first = await calc.getByRole("status").locator(":scope > *").first().elementHandle();
  await button.click();
  await expect(calc.getByRole("status")).toContainText("≈ 22");
  expect(await first!.evaluate((el) => el.isConnected), "the old answer node is still in the page").toBe(false);
});

test("the same goes for an unchanged error", async ({ page }) => {
  const calc = await open(page);
  const button = calc.getByRole("button", { name: "คำนวณ" });
  await button.click();
  const first = await calc.getByRole("alert").locator(":scope > *").first().elementHandle();
  await button.click();
  await expect(calc.getByRole("alert")).toHaveText("กรอกปริมาณธาตุที่ต้องการ");
  expect(await first!.evaluate((el) => el.isConnected)).toBe(false);
});

test.describe("the working shows the inputs as typed and never contradicts its own last step", () => {
  const cases: [string, string, string[]][] = [
    ["10", "46", ["10 × 100 = 1,000", "1,000 ÷ 46 = 21.74", "21.74 ≈ 22"]],
    ["22.499", "100", ["22.499 × 100 = 2,249.9", "2,249.9 ÷ 100 = 22.499", "22.499 ≈ 22"]],
    ["10.005", "46", ["10.005 × 100 = 1,000.5", "1,000.5 ÷ 46 = 21.75", "21.75 ≈ 22"]],
    ["2.3", "20", ["2.3 × 100 = 230", "230 ÷ 20 = 11.5", "11.5 ≈ 12"]],
  ];
  for (const [target, percent, lines] of cases) {
    test(`${target} kg N at ${percent}% N`, async ({ page }) => {
      const calc = await open(page);
      await calc.getByLabel(TARGET).fill(target);
      await calc.getByLabel("N (%)").fill(percent);
      await calc.getByLabel("P₂O₅ (%)").fill("0");
      await calc.getByLabel("K₂O (%)").fill("0");
      await calc.getByRole("button", { name: "คำนวณ" }).click();
      await expect(calc.getByRole("status").locator("ol li")).toHaveText(lines);
    });
  }
});

test("the picker uses the system font, not the web font (WebKit stops firing `load` otherwise)", async ({ page }) => {
  const calc = await open(page);
  const family = await calc.getByLabel("เลือกสูตรที่มีในเอกสาร").evaluate((el) => getComputedStyle(el).fontFamily);
  expect(family).not.toMatch(/Sarabun|Noto Sans Thai/);
});

test("chapter 3 always reaches the load event when arrived at from another chapter", async ({ page }) => {
  // The select-and-web-font bug hung about a third of these; eight in a row is a reliable canary.
  for (let i = 0; i < 8; i++) {
    await page.goto("/th/ch02", { timeout: 10_000 });
    await page.goto("/th/ch03", { timeout: 10_000 });
    await page.evaluate(() => document.documentElement.scrollWidth);
  }
});
