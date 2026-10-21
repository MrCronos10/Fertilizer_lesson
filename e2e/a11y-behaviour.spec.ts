import { expect, test, type Page } from "@playwright/test";
import { ROUTES } from "../lib/budget";

/**
 * T-025: what axe cannot see. Keyboard operability (focus is visible and nothing is clickable but
 * not focusable), reduced motion everywhere, information not carried by colour alone, and a name
 * plus a text alternative on both 3D scenes.
 *
 * Playwright's WebKit cannot drive Tab onto radios and buttons: macOS Safari skips them unless
 * Option-Tab or Full Keyboard Access is on. So reachability is proven structurally (every control is
 * a native focusable element, none has a positive tabindex) and each widget's own spec drives it
 * with focus + arrow/Enter/Space keys; the Tab order itself needs the manual pass.
 */
const INTERACTIVE = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [tabindex]:not([tabindex="-1"])';

async function settle(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle" });
}

for (const route of ROUTES) {
  test(`${route.path}: every control is natively focusable and shows where focus is`, async ({ page }) => {
    await settle(page, route.path);
    const report = await page.evaluate((selector) => {
      const problems: string[] = [];
      // A key press first, so the browser treats later focus as keyboard focus (:focus-visible).
      const els = [...document.querySelectorAll<HTMLElement>(selector)].filter((el) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return s.visibility !== "hidden" && s.display !== "none" && !el.closest("[hidden]") && (r.width > 0 || el.matches("input"));
      });
      const describe = (el: Element) => `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}.${(el as HTMLElement).className}`.slice(0, 80);
      for (const el of els) {
        if (el.tabIndex > 0) problems.push(`positive tabindex on ${describe(el)}`);
        el.focus({ preventScroll: true });
        if (document.activeElement !== el) {
          problems.push(`cannot take focus: ${describe(el)}`);
          continue;
        }
        // The ring may sit on the control or, for the visually hidden radios, on the label that wraps it.
        const candidates = [el, el.closest("label"), el.closest("a")].filter(Boolean) as HTMLElement[];
        const shows = candidates.some((c) => {
          const s = getComputedStyle(c);
          const outline = s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0;
          const shadow = s.boxShadow !== "none";
          return outline || shadow;
        });
        if (!shows) problems.push(`no visible focus indicator: ${describe(el)}`);
      }
      return { count: els.length, problems };
    }, INTERACTIVE);
    expect(report.count, "found controls to check").toBeGreaterThan(0);
    expect(report.problems).toEqual([]);
  });

  test(`${route.path}: nothing looks clickable but cannot be focused or reached`, async ({ page }) => {
    await settle(page, route.path);
    const stray = await page.evaluate((selector) => {
      const native = new Set(["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA", "SUMMARY", "LABEL", "OPTION"]);
      const out: string[] = [];
      for (const el of document.body.querySelectorAll<HTMLElement>("*")) {
        const s = getComputedStyle(el);
        if (s.cursor !== "pointer" || s.display === "none" || native.has(el.tagName)) continue;
        // A pointer cursor is fine inside a real control (it inherits).
        if (el.closest(selector) || el.closest("label")) continue;
        out.push(`${el.tagName.toLowerCase()}.${el.className}`.slice(0, 80));
      }
      return out;
    }, INTERACTIVE);
    expect(stray).toEqual([]);
  });

  test(`${route.path}: prefers-reduced-motion leaves nothing animating or easing`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await settle(page, route.path);
    await page.waitForTimeout(400);
    const found = await page.evaluate(() => {
      const long: string[] = [];
      const ms = (v: string) => v.split(",").map((x) => (x.trim().endsWith("ms") ? parseFloat(x) : parseFloat(x) * 1000));
      for (const el of document.body.querySelectorAll<Element>("*")) {
        const s = getComputedStyle(el);
        if (s.animationName !== "none" && Math.max(...ms(s.animationDuration)) > 1) long.push(`animation on ${el.tagName}.${(el as HTMLElement).className}`);
        if (Math.max(...ms(s.transitionDuration)) > 1) long.push(`transition on ${el.tagName}.${(el as HTMLElement).className}`);
      }
      return { long, running: document.getAnimations().filter((a) => a.playState === "running" && Number(a.effect?.getComputedTiming().duration ?? 0) > 1).length, smooth: getComputedStyle(document.documentElement).scrollBehavior };
    });
    expect(found.long).toEqual([]);
    expect(found.running).toBe(0);
    expect(found.smooth).not.toBe("smooth");
  });
}

test("a tier is never told by colour alone: each badge has its own shape and its word", async ({ page }) => {
  const seen = new Map<string, { glyph: string; word: string; border: string }>();
  for (const path of ["/th/ch02", "/th/ch04", "/th/ch05"]) {
    await settle(page, path);
    if (path.endsWith("ch05")) await page.getByRole("group", { name: "เลือกพืช" }).getByLabel("อ้อย", { exact: true }).check();
    const badges = await page.locator("[data-tier]").evaluateAll((els) =>
      els.map((el) => ({
        tier: el.getAttribute("data-tier")!,
        glyph: el.querySelector("[aria-hidden=true]")?.textContent?.trim() ?? "",
        text: (el.textContent ?? "").replace(/\s+/g, " ").trim(),
        border: getComputedStyle(el).borderTopStyle,
        label: el.querySelector(".visually-hidden")?.textContent?.trim() ?? "",
      })),
    );
    for (const b of badges) {
      expect(b.glyph, `${path} ${b.tier} has a shape`).not.toBe("");
      expect(b.text.length, `${path} ${b.tier} has words`).toBeGreaterThan(b.glyph.length);
      expect(b.label, `${path} ${b.tier} says what it is to a screen reader`).toBe("ระดับแหล่งที่มา:");
      const word = b.text.replace(b.glyph, "").replace(b.label, "").trim();
      seen.set(b.tier, { glyph: b.glyph, word, border: b.border });
    }
  }
  expect([...seen.keys()].sort()).toEqual(["commercial", "official", "research"].filter((t) => seen.has(t)));
  expect(seen.has("official") && seen.has("commercial")).toBe(true);
  const glyphs = [...seen.values()].map((v) => v.glyph);
  const words = [...seen.values()].map((v) => v.word);
  expect(new Set(glyphs).size, "one shape per tier").toBe(glyphs.length);
  expect(new Set(words).size, "one word per tier").toBe(words.length);
  expect(seen.get("commercial")!.border, "the weakest tier also looks different (dashed)").toBe("dashed");
});

test("a selected choice is shown by more than colour: a checked state, and a fill or marker", async ({ page }) => {
  await settle(page, "/th/ch05");
  const group = page.getByRole("group", { name: "เลือกพืช" });
  const checked = group.getByRole("radio", { checked: true });
  await expect(checked).toHaveCount(1); // exposed to assistive tech, not only drawn
  const bg = await group.locator("label:has(input:checked)").evaluate((el) => getComputedStyle(el).backgroundColor);
  const other = await group.locator("label:not(:has(input:checked))").first().evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).not.toBe(other);
  // The radio's own dot is drawn too: it is a real native radio.
  expect(await checked.evaluate((el) => (el as HTMLInputElement).type)).toBe("radio");
});

test("a field in error says so in words and in its state, not by a red border alone", async ({ page }) => {
  await settle(page, "/th/ch03");
  const calc = page.locator("section.calculator");
  await calc.getByRole("button", { name: "คำนวณ" }).click();
  const field = calc.getByLabel("ปริมาณธาตุที่ต้องการ (กก./ไร่)");
  await expect(field).toHaveAttribute("aria-invalid", "true");
  const message = await field.getAttribute("aria-describedby");
  expect(message).toBeTruthy();
  await expect(page.locator(`#${message!.split(" ")[0]}`)).toHaveText(/\S/);
  await expect(calc.getByRole("alert").first()).toContainText("กรอก");
});

test("both 3D scenes have a name and a text alternative", async ({ page }) => {
  // Chapter 1's plant: a named image, with the choice and the full symptom table as its text alternative.
  await settle(page, "/th/ch01");
  await page.locator(".deficiency").scrollIntoViewIfNeeded();
  const plant = page.locator('.scene3d[role="img"]');
  await expect(plant).toHaveAttribute("aria-label", /\S/);
  expect(await plant.getAttribute("aria-label")).toBe("ภาพวาดต้นพืชสามมิติ ลากเพื่อหมุน");
  await expect(page.getByRole("group", { name: "เลือกตำแหน่งใบ" }).getByRole("radio")).toHaveCount(3);
  await expect(page.locator("table", { has: page.locator('[data-row="zn"]') }).locator("tbody tr")).toHaveCount(10);
  // The scene's own children are not exposed (role=img), so everything it shows is also in text.
  expect(await plant.evaluate((el) => el.getAttribute("aria-hidden"))).toBeNull();

  // The reusable scene on the specimen route: named, and its fallback text exists for when WebGL is not there.
  await settle(page, "/specimen-3d");
  await expect(page.locator('.scene3d[role="img"]')).toHaveAttribute("aria-label", "Rotating green solid");
  await expect(page.locator("#lesson-text")).toBeVisible();
});

test("no control relies on hover, and no content appears only on hover", async ({ page }) => {
  for (const path of ["/th", "/th/ch03", "/th/ch05", "/th/ch07"]) {
    await settle(page, path);
    const hover = await page.evaluate(() => {
      const rules: string[] = [];
      for (const sheet of document.styleSheets) {
        for (const rule of sheet.cssRules) {
          if (/:hover/.test(rule.cssText) && /(display|visibility|opacity|content)\s*:/.test(rule.cssText)) rules.push(rule.cssText.slice(0, 100));
        }
      }
      return rules;
    });
    expect(hover, path).toEqual([]);
  }
});

/**
 * WCAG 1.4.11: the edge of a control has to stand out from what is behind it by 3:1, because that
 * edge is often what says "this is a control". Axe does not measure it, so it is measured here, in
 * light and dark, with the border's own transparency blended over the page.
 */
for (const scheme of ["light", "dark"] as const) {
  test(`control borders reach 3:1 against the page, ${scheme} theme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    const worst: string[] = [];
    for (const path of ["/th/ch03", "/th/ch05", "/th/ch07", "/th/ch01"]) {
      await settle(page, path);
      const rows = await page.evaluate(() => {
        const parse = (c: string): number[] => (c.match(/[\d.]+/g) ?? []).map(Number);
        const blend = (fg: number[], bg: number[]) => {
          const a = fg[3] ?? 1; // alpha
          return [0, 1, 2].map((i) => fg[i]! * a + bg[i]! * (1 - a));
        };
        const lum = (c: number[]) => {
          const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
          return 0.2126 * f(c[0]!) + 0.7152 * f(c[1]!) + 0.0722 * f(c[2]!);
        };
        const ratio = (a: number[], b: number[]) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
        const page = parse(getComputedStyle(document.body).backgroundColor);
        const out: { what: string; ratio: number }[] = [];
        const targets = "button, select, input[type=text], .def-option, .calc-choice, .bag-tile, .quiz-toggle";
        for (const el of document.querySelectorAll<HTMLElement>(targets)) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || el.closest("[hidden]")) continue;
          const s = getComputedStyle(el);
          if (s.borderTopStyle === "none" || parseFloat(s.borderTopWidth) === 0) continue;
          // The page behind a control is the nearest opaque-ish background, else the body.
          let behind: number[] = page;
          for (let p: HTMLElement | null = el.parentElement; p; p = p.parentElement) {
            const bg = parse(getComputedStyle(p).backgroundColor);
            if ((bg[3] ?? 1) > 0.5) { behind = blend(bg, page); break; }
          }
          // A filled button (the primary one) has a transparent border: its fill is its edge.
          const border = parse(s.borderTopColor);
          const edge = blend((border[3] ?? 1) > 0.1 ? border : parse(s.backgroundColor), behind);
          out.push({ what: `${el.tagName.toLowerCase()}.${el.className}`.slice(0, 40), ratio: ratio(edge, behind) });
        }
        return out;
      });
      for (const r of rows) if (r.ratio < 3) worst.push(`${path} ${r.what}: ${r.ratio.toFixed(2)}:1`);
    }
    expect([...new Set(worst)]).toEqual([]);
  });
}

/* ------------------------------------------------------------------ review round (T-025) */

test("a focus ring appears because of focus: the control looks different focused than not", async ({ page }) => {
  await settle(page, "/th/ch03");
  const unchanged = await page.evaluate((selector) => {
    const sig = (el: HTMLElement) => {
      const s = getComputedStyle(el);
      return `${s.outlineStyle}|${s.outlineWidth}|${s.outlineColor}|${s.boxShadow}`;
    };
    const out: string[] = [];
    const els = [...document.querySelectorAll<HTMLElement>(selector)].filter((el) => !el.closest("[hidden]") && el.getBoundingClientRect().width > 0);
    for (const el of els) {
      const targets = [el, el.closest("label"), el.closest("a")].filter(Boolean) as HTMLElement[];
      (document.activeElement as HTMLElement | null)?.blur();
      const before = targets.map(sig);
      el.focus({ preventScroll: true });
      const after = targets.map(sig);
      if (before.every((b, i) => b === after[i])) out.push(`${el.tagName.toLowerCase()}.${el.className}`.slice(0, 60));
    }
    return { count: els.length, out };
  }, INTERACTIVE);
  expect(unchanged.count).toBeGreaterThan(8);
  expect(unchanged.out, "controls whose look does not change when focused").toEqual([]);
});

test("the focus ring is at least 2 px and is not the page colour", async ({ page }) => {
  await settle(page, "/th/ch03");
  const ring = await page.locator("section.calculator").getByRole("button", { name: "คำนวณ" }).evaluate((el) => {
    (el as HTMLElement).focus();
    const s = getComputedStyle(el);
    return { width: parseFloat(s.outlineWidth), style: s.outlineStyle, colour: s.outlineColor, bg: getComputedStyle(document.body).backgroundColor };
  });
  expect(ring.style).not.toBe("none");
  expect(ring.width).toBeGreaterThanOrEqual(2);
  expect(ring.colour).not.toBe(ring.bg);
});

test("no script scrolls or animates by itself: no smooth scrolling and no timers in the code", async () => {
  const { readFileSync, readdirSync, statSync } = await import("node:fs");
  const { join } = await import("node:path");
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((n) => {
      const p = join(dir, n);
      if (n === "node_modules" || n === ".next") return [];
      return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|css)$/.test(n) && !/\.test\./.test(n) ? [p] : [];
    });
  const offenders: string[] = [];
  for (const file of [...walk(join(process.cwd(), "components")), ...walk(join(process.cwd(), "app"))]) {
    const text = readFileSync(file, "utf8");
    if (/behavior:\s*["']smooth["']|scroll-behavior:\s*smooth/.test(text)) offenders.push(`${file}: smooth scrolling`);
    if (/setInterval\(|requestAnimationFrame\(/.test(text)) offenders.push(`${file}: a timer or animation loop`);
  }
  expect(offenders).toEqual([]);
});

test("every route has its own page title", async ({ request }) => {
  // Read from the served HTML (titles are rendered on the server), so eleven routes do not need eleven page loads.
  const titles = new Map<string, string>();
  for (const route of ROUTES) {
    const html = await (await request.get(route.path)).text();
    const title = (/<title[^>]*>([^<]*)<\/title>/.exec(html)?.[1] ?? "").trim();
    expect(title, `${route.path} has a title`).not.toBe("");
    expect(titles.get(title), `${route.path} repeats the title of ${titles.get(title)}`).toBeUndefined();
    titles.set(title, route.path);
  }
});

test("the page is Thai, English snippets in lessons are marked, and zooming is not blocked", async ({ page }) => {
  await settle(page, "/th/ch02");
  expect(await page.evaluate(() => document.documentElement.lang)).toBe("th");
  expect(await page.evaluate(() => document.querySelector('meta[name="viewport"]')?.getAttribute("content"))).not.toMatch(/user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b/);
  // Source names are English words inside Thai text; each carries lang="en".
  const unmarked = await page.locator(".cite a, .source-list li").evaluateAll((els) =>
    els.filter((el) => /[A-Za-z]{3,}/.test(el.textContent ?? "") && !el.querySelector('[lang="en"]') && el.getAttribute("lang") !== "en").map((el) => (el.textContent ?? "").slice(0, 40)),
  );
  expect(unmarked).toEqual([]);
});

test("controls that are not part of a sentence are at least 24 x 24 CSS px (WCAG 2.5.8; the design uses 44)", async ({ page }) => {
  const small: string[] = [];
  for (const path of ["/th", "/th/ch01", "/th/ch02", "/th/ch03", "/th/ch05", "/th/ch07"]) {
    await settle(page, path);
    const rows = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("button, input:not([type=hidden]), select, summary, nav a, .jump-sources, .skip-link, .chapter-list a, .source-list a")]
        .filter((el) => !el.closest("[hidden]") && getComputedStyle(el).visibility !== "hidden")
        .map((el) => {
          // A visually hidden radio is its label's tap target.
          const box = (el.matches("input") && el.closest("label") ? el.closest("label")! : el).getBoundingClientRect();
          return { what: `${el.tagName.toLowerCase()}.${el.className}`.slice(0, 50), w: box.width, h: box.height };
        })
        .filter((r) => r.w > 0 && (r.w < 24 || r.h < 24)),
    );
    small.push(...rows.map((r) => `${path} ${r.what} ${Math.round(r.w)}x${Math.round(r.h)}`));
  }
  expect([...new Set(small)]).toEqual([]);
});

/** A window as narrow as a reflow test needs (320 CSS px, WCAG 1.4.10) and at double text size. */
for (const mode of ["320 px wide", "320 px wide with the WCAG text-spacing override", "200% text size"] as const) {
  test(`${mode}: no route scrolls sideways or clips its text`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    const bad: string[] = [];
    for (const route of ROUTES) {
      await page.goto(route.path, { waitUntil: "networkidle" });
      if (mode.includes("spacing")) {
        await page.addStyleTag({ content: "* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }" });
      }
      if (mode.startsWith("200%")) await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
      const found = await page.evaluate(() => {
        const out: string[] = [];
        if (document.documentElement.scrollWidth > document.documentElement.clientWidth) out.push(`page scrolls sideways (${document.documentElement.scrollWidth} > ${document.documentElement.clientWidth})`);
        for (const el of document.body.querySelectorAll<HTMLElement>("*")) {
          const s = getComputedStyle(el);
          if (el.closest("svg") || s.display === "none" || el.closest("[hidden]") || el.classList.contains("visually-hidden")) continue;
          // Text cut off by a fixed-size box: it overflows and the box hides it.
          if ((s.overflowX === "hidden" || s.overflowY === "hidden") && !el.closest("canvas") && !el.classList.contains("scene3d") && !el.matches(".visually-hidden") && (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) && (el.textContent ?? "").trim().length > 0) out.push(`clipped ${el.tagName.toLowerCase()}.${el.className}`.slice(0, 80));
        }
        return out;
      });
      bad.push(...found.map((f) => `${route.path}: ${f}`));
    }
    expect([...new Set(bad)]).toEqual([]);
  });
}

for (const width of [320, 768]) test(`a focused control is never hidden behind the sticky bar, at ${width} px wide with double text size`, async ({ page }) => {
  await page.setViewportSize({ width, height: 640 });
  const hidden: string[] = [];
  for (const path of ["/th/ch01", "/th/ch02", "/th/ch03", "/th/ch05", "/th/ch07"]) {
    await page.goto(path, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    const count = await page.evaluate((selector) => {
      const bar = document.querySelector<HTMLElement>(".jump-sources");
      if (!bar) return 0;
      const els = [...document.querySelectorAll<HTMLElement>(selector)].filter(
        (el) => !el.closest("[hidden]") && el.getBoundingClientRect().width > 0 && !!(bar.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) && !bar.contains(el),
      );
      els.forEach((el, i) => el.setAttribute("data-a11y-i", String(i)));
      return els.length;
    }, INTERACTIVE);
    for (let i = 0; i < count; i++) {
      // From the bottom of the page, so a control higher up has to be scrolled UP to: that is the direction in
      // which the sticky bar can end up on top of it. A control already on screen is not scrolled by the browser
      // at all, so it is not this scenario.
      const row = await page.evaluate(async (i) => {
        window.scrollTo(0, document.documentElement.scrollHeight);
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        const el = document.querySelector<HTMLElement>(`[data-a11y-i="${i}"]`)!;
        const target = el.matches("input") && el.closest("label") ? el.closest("label")! : el;
        const was = target.getBoundingClientRect();
        if (was.bottom > 0 && was.top < window.innerHeight) return null;
        el.focus(); // the browser scrolls it into view, honouring scroll-padding-top
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        const bar = document.querySelector<HTMLElement>(".jump-sources")!.getBoundingClientRect();
        const r = target.getBoundingClientRect();
        // A control taller than the room under the bar (a whole table, which scrolls) only needs part of itself
        // visible below the bar; any other control must start below it.
        const tall = r.height > window.innerHeight - bar.bottom;
        const covered = tall ? r.bottom <= bar.bottom + 20 : r.top < bar.bottom - 1;
        return bar.bottom > 0 && covered ? `${el.tagName.toLowerCase()}.${el.className} top=${Math.round(r.top)} bar=${Math.round(bar.top)}..${Math.round(bar.bottom)}`.slice(0, 90) : null;
      }, i);
      if (row) hidden.push(`${path} ${row}`);
    }
  }
  expect([...new Set(hidden)]).toEqual([]);
});
