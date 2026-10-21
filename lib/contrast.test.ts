import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Contrast is the main accessibility risk in a ported palette, so it is
 * asserted rather than eyeballed. Ratios are computed from the token values in
 * globals.css, so changing a token fails here before it reaches a screenshot.
 */

// Comments are stripped first: prose like "Not --accent: gold on cream..."
// otherwise parses as a declaration and silently shadows the real token.
const CSS = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8").replace(
  /\/\*[\s\S]*?\*\//g,
  "",
);

type Rgb = readonly [number, number, number];

function block(selector: string): Record<string, string> {
  const start = CSS.indexOf(selector);
  if (start === -1) throw new Error(`selector not found: ${selector}`);
  const open = CSS.indexOf("{", start);
  const close = CSS.indexOf("}", open);
  const tokens: Record<string, string> = {};
  for (const [, name, value] of CSS.slice(open, close).matchAll(/(--[a-z-]+):\s*([^;]+);/g)) {
    if (name && value) tokens[name] = value.trim();
  }
  return tokens;
}

function parse(value: string, over: Rgb): Rgb {
  const hex = /^#([0-9a-f]{6})$/i.exec(value);
  if (hex?.[1]) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rgba = /rgba?\(([^)]+)\)/.exec(value);
  if (!rgba?.[1]) throw new Error(`cannot parse colour: ${value}`);
  const parts = rgba[1].split(",").map((p) => Number(p.trim()));
  const [r = 0, g = 0, b = 0, a = 1] = parts;
  // Composite onto the surface it actually sits on.
  return [
    Math.round(r * a + over[0] * (1 - a)),
    Math.round(g * a + over[1] * (1 - a)),
    Math.round(b * a + over[2] * (1 - a)),
  ];
}

function luminance(rgb: Rgb): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
}

function ratio(a: Rgb, b: Rgb): number {
  const la = luminance(a);
  const lb = luminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

const LIGHT = block(":root {");
const DARK = block(':root[data-theme="dark"]');

/** Dark only overrides some tokens; the rest cascade from :root. */
function resolve(theme: Record<string, string>, token: string): string {
  const value = theme[token] ?? LIGHT[token];
  if (!value) throw new Error(`token not defined in either theme: ${token}`);
  return value;
}

describe.each([
  ["light", LIGHT],
  ["dark", DARK],
])("%s theme contrast", (_name, theme) => {
  const bg = parse(resolve(theme, "--bg"), [255, 255, 255]);
  const at = (token: string, over: Rgb = bg) => parse(resolve(theme, token), over);

  // WCAG 1.4.3 — body text.
  it.each(["--ink", "--muted"])("%s on --bg meets 4.5:1", (fg) => {
    expect(ratio(at(fg), bg)).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    ["--warn", "--warn-bg"],
    ["--brand-ink", "--brand"],
    ["--accent-ink", "--accent"],
    // Official/research tier badges (.tier) sit on --soft.
    ["--ink", "--soft"],
    ["--muted", "--bg"],
  ])("%s on %s meets 4.5:1", (fg, surface) => {
    const base = at(surface);
    expect(ratio(at(fg, base), base)).toBeGreaterThanOrEqual(4.5);
  });

  // WCAG 1.4.11 — non-text contrast for focus indicators and component edges.
  it("--ring is a visible focus indicator against --bg (3:1)", () => {
    expect(ratio(at("--ring"), bg)).toBeGreaterThanOrEqual(3);
  });

  it("--line gives panels and secondary buttons a visible edge (3:1)", () => {
    expect(ratio(at("--line"), bg)).toBeGreaterThanOrEqual(3);
  });
});

describe("theme token parity", () => {
  it("dark overrides every colour token except the deliberate carry-overs", () => {
    // --accent/--accent-ink are intentionally shared with light: accent-ink on
    // accent is 8.2:1 in both themes, and gold on the dark background is 9.9:1.
    const carriedOver = ["--accent", "--accent-ink"];
    const nonColour = ["--tap", "--gutter", "--radius"];

    const colourTokens = Object.keys(LIGHT).filter(
      (t) => !t.startsWith("--font") && !nonColour.includes(t) && !carriedOver.includes(t),
    );

    expect(colourTokens.length).toBeGreaterThan(5);
    for (const token of colourTokens) {
      expect(Object.keys(DARK), `dark theme must override ${token}`).toContain(token);
    }
  });
});
