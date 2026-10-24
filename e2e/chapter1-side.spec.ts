import { expect, test } from "@playwright/test";
import { collectPageProblems } from "./console";

test("the side column holds the explorer card and the sources card, beside the reading column at 1366", async ({ page }) => {
  const problems = collectPageProblems(page);
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/th/ch01");
  const side = page.locator(".side-column");
  await expect(side.locator(".def-card")).toHaveCount(1);
  await expect(side.locator("section#sources.sources-card")).toHaveCount(1);
  const reading = (await page.locator(".reading-column").boundingBox())!;
  const card = (await page.locator(".def-card").boundingBox())!;
  expect(card.x).toBeGreaterThan(reading.x + reading.width);
  expect(problems).toEqual([]);
});

test("the leaf picker is a radio group of 48 px choices, and the answer card follows the choice", async ({ page }) => {
  await page.goto("/th/ch01");
  const group = page.getByRole("group", { name: "เลือกตำแหน่งใบ" });
  const labels = ["ใบแก่", "ใบอ่อน/ยอด", "เอกสารไม่ระบุตำแหน่งใบ"];
  for (const name of labels) {
    const option = group.getByRole("radio", { name });
    expect((await option.locator("xpath=..").boundingBox())!.height).toBeGreaterThanOrEqual(48);
  }
  const panel = page.locator(".def-panel .panel");
  await expect(panel).toHaveAttribute("data-group", "old");
  await expect(panel.locator(".def-badge")).toHaveText("ใบแก่");
  await expect(panel.locator(".def-rule")).toHaveText("ธาตุที่เคลื่อนที่ได้ในพืช (N, P, K, Mg) แสดงอาการที่ ใบแก่ ก่อน");
  await group.getByRole("radio", { name: "ใบอ่อน/ยอด" }).check();
  await expect(panel).toHaveAttribute("data-group", "young");
  await expect(panel.locator(".def-badge")).toHaveText("ใบอ่อน/ยอด");
  await group.getByRole("radio", { name: "เอกสารไม่ระบุตำแหน่งใบ" }).check();
  await expect(panel.locator(".def-badge")).toHaveText("ไม่ระบุ");
  await expect(panel.locator(".def-badge")).toHaveAttribute("aria-hidden", "true");
});

test("the plant is still a live 3D canvas inside the card, sized as the artboard draws it", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/th/ch01", { waitUntil: "networkidle" });
  await page.locator(".def-scene").scrollIntoViewIfNeeded();
  const canvas = page.locator(".def-scene .scene3d canvas:visible");
  await expect(canvas).toHaveCount(1, { timeout: 10_000 });
  const box = (await page.locator(".def-scene .scene3d").boundingBox())!;
  expect(box.width).toBeCloseTo(200, 0);
  expect(box.height).toBeCloseTo(226, 0);
});

test("the sources card keeps every source with its tier and ends with the soil-test strip", async ({ page }) => {
  await page.goto("/th/ch01");
  const card = page.locator("section#sources");
  await expect(card.getByRole("heading", { level: 2, name: "ที่มาของข้อมูล" })).toBeVisible();
  await expect(card.locator("li[id^='src-']")).toHaveCount(2);
  await expect(card.locator("[data-tier]")).toHaveCount(2);
  await expect(card.locator(".safe-strip")).toHaveText("อัตราปุ๋ยที่แสดงบนเว็บไซต์เป็น จุดเริ่มต้น เท่านั้น แนะนำให้ ตรวจวิเคราะห์ดิน ก่อนใช้ปุ๋ยจริง");
  for (const a of await card.locator(".source-list a").all()) expect((await a.boundingBox())!.height).toBeGreaterThanOrEqual(44);
});

test("every chapter has one sources card with the soil-test strip (all seven are redesigned, T-043–T-052)", async ({ page }) => {
  for (const n of ["01", "02", "03", "04", "05", "06", "07"]) {
    await page.goto(`/th/ch${n}`);
    await expect(page.locator("section#sources.sources-card"), `ch${n}`).toHaveCount(1);
    await expect(page.locator(".safe-strip"), `ch${n}`).toHaveCount(1);
  }
});
