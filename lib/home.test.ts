import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { nutrientGroupRows } from "./data";
import { HERO_MODE_SCRIPT, PATH_MARKERS, heroMode, npkRoles } from "./home";
import { THEME_SCRIPT, nextTheme } from "./theme";

/** Runs an inline <head> script against stand-ins for the browser globals it touches. */
function run(script: string, globals: Record<string, unknown>) {
  const root = { dataset: {} as Record<string, string> };
  const doc = { documentElement: root, createElement: () => ({ getContext: globals.getContext }) };
  new Function("document", "matchMedia", "localStorage", script)(doc, globals.matchMedia, globals.localStorage);
  return root.dataset;
}

const media = (reduce: boolean, dark = false) => (q: string) => ({
  matches: q.includes("reduced-motion") ? reduce : q.includes("dark") ? dark : false,
});
const gl = () => ({ getExtension: () => ({ loseContext: () => {} }) });

describe("heroMode", () => {
  it("is 3d only with WebGL and without reduced motion", () => {
    expect(heroMode({ webgl: true, reducedMotion: false })).toBe("3d");
    expect(heroMode({ webgl: true, reducedMotion: true })).toBe("flat");
    expect(heroMode({ webgl: false, reducedMotion: false })).toBe("flat");
  });
});

describe("HERO_MODE_SCRIPT (runs before the hero is painted)", () => {
  it("chooses 3d when WebGL works and motion is allowed", () => {
    expect(run(HERO_MODE_SCRIPT, { matchMedia: media(false), getContext: gl }).hero).toBe("3d");
  });
  it("chooses flat under prefers-reduced-motion", () => {
    expect(run(HERO_MODE_SCRIPT, { matchMedia: media(true), getContext: gl }).hero).toBe("flat");
  });
  it("chooses flat when no context can be made, or the probe throws", () => {
    expect(run(HERO_MODE_SCRIPT, { matchMedia: media(false), getContext: () => null }).hero).toBe("flat");
    const boom = () => {
      throw new Error("blocked");
    };
    expect(run(HERO_MODE_SCRIPT, { matchMedia: media(false), getContext: boom }).hero).toBe("flat");
  });
  it("releases the probe context (D16: one live context)", () => {
    let lost = 0;
    const counting = () => ({ getExtension: () => ({ loseContext: () => lost++ }) });
    run(HERO_MODE_SCRIPT, { matchMedia: media(false), getContext: counting });
    expect(lost).toBe(1);
  });
});

describe("theme", () => {
  it("toggles between the two themes", () => {
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("light");
  });

  const store = (value: string | null) => ({ getItem: () => value });
  it("THEME_SCRIPT applies a remembered choice before paint", () => {
    expect(run(THEME_SCRIPT, { localStorage: store("dark") }).theme).toBe("dark");
    expect(run(THEME_SCRIPT, { localStorage: store("light") }).theme).toBe("light");
  });
  it("THEME_SCRIPT ignores junk and blocked storage, leaving the system preference", () => {
    expect(run(THEME_SCRIPT, { localStorage: store("purple") }).theme).toBeUndefined();
    expect(run(THEME_SCRIPT, { localStorage: store(null) }).theme).toBeUndefined();
    const blocked = {
      getItem: () => {
        throw new Error("SecurityError");
      },
    };
    expect(run(THEME_SCRIPT, { localStorage: blocked }).theme).toBeUndefined();
  });
});

describe("npkRoles", () => {
  it("splits the pamphlet's p2 macronutrient line into one caption per element, word for word", () => {
    const row = nutrientGroupRows().find((r) => r.id === "macronutrients")!;
    expect(npkRoles(row)).toEqual({
      N: "ใบเขียว โตเร็ว",
      P: "ราก ดอก เมล็ด",
      K: "ผลโต หวาน ต้นแข็ง ทนโรค",
    });
  });
  it("fails loudly if the line no longer names all three", () => {
    const row = nutrientGroupRows().find((r) => r.id === "macronutrients")!;
    const broken = { ...row, labels: { th: { ...row.labels.th, role: "N = ใบเขียว" } } };
    expect(() => npkRoles(broken)).toThrow(/P/);
  });
});

describe("PATH_MARKERS", () => {
  it("places all seven chapters in both drawn layouts, chapter 1 first", () => {
    for (const layout of ["landscape", "portrait"] as const) {
      expect(PATH_MARKERS[layout]).toHaveLength(7);
      expect(PATH_MARKERS[layout][0]!.current).toBe(true);
      expect(PATH_MARKERS[layout].slice(1).every((m) => !m.current)).toBe(true);
    }
  });
});

describe("home.css", () => {
  it("scopes every rule to the home page, so its scene class names never reach a chapter", () => {
    const css = readFileSync(join(process.cwd(), "app/[locale]/home.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/@[^{]+\{/g, "{"); // an at-rule's prelude is not a selector
    const selectors = [...css.matchAll(/([^{}@]+)\{/g)].flatMap((m) => m[1]!.split(",").map((s) => s.trim()))
      .filter(Boolean);
    expect(selectors.length).toBeGreaterThan(100);
    expect(selectors.filter((s) => !/(^|\s)\.home(\s|$|[.:\[])/.test(s))).toEqual([]);
  });
});
