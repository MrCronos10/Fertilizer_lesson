import type { NutrientGroupRow } from "./data";

/**
 * The home hero (T-027) has two drawings: the live 3D soil block, and the flat 2.5D plate that
 * is its real stand-in. Which one shows is decided once, before the hero paints, so the page
 * never swaps layouts under the reader.
 */
export type HeroMode = "3d" | "flat";

export function heroMode({ webgl, reducedMotion }: { webgl: boolean; reducedMotion: boolean }): HeroMode {
  return webgl && !reducedMotion ? "3d" : "flat";
}

/**
 * Inlined at the top of the home page, so it runs before the hero is parsed. It sets
 * `<html data-hero>`, which the stylesheet reads. Without JavaScript the attribute is never set
 * and the page shows the flat hero, which is complete on its own. The probe context is released
 * at once (D16 allows one live context). Same rule as `heroMode`, which the client re-applies
 * after a client-side navigation, where an inline script does not run.
 */
export const HERO_MODE_SCRIPT = `(function(){var m="flat";try{if(!matchMedia("(prefers-reduced-motion: reduce)").matches){var c=document.createElement("canvas");var g=c.getContext("webgl2")||c.getContext("webgl");if(g){m="3d";var l=g.getExtension("WEBGL_lose_context");if(l)l.loseContext()}}}catch(e){m="flat"}document.documentElement.dataset.hero=m})()`;

export type Element = "N" | "P" | "K";
export const ELEMENTS: readonly Element[] = ["N", "P", "K"];

/** "N = ใบเขียว โตเร็ว; P = …; K = …" (pamphlet p2) → one caption per element, unchanged. */
export function npkRoles(row: NutrientGroupRow): Record<Element, string> {
  const parts = new Map(
    row.labels.th.role.split(";").map((part) => {
      const [symbol, ...rest] = part.split("=");
      return [symbol!.trim(), rest.join("=").trim()] as const;
    }),
  );
  const out = {} as Record<Element, string>;
  for (const e of ELEMENTS) {
    const caption = parts.get(e);
    if (!caption) throw new Error(`nutrient-groups: no caption for ${e} in "${row.labels.th.role}"`);
    out[e] = caption;
  }
  return out;
}

/**
 * Where each chapter marker sits on the drawn path, in the artboard's own pixels (Main.dc.html is
 * 1366 wide, Home-Portrait.dc.html 834). The stylesheet turns `x` into a percentage of that width,
 * so the markers stay on the path at any width; `y` stays in pixels because the band's height
 * does not change. The phone has no drawn path: it is a plain list.
 */
export type PathMarker = { readonly x: number; readonly y: number; readonly current: boolean };

const marks = (points: readonly (readonly [number, number])[]): readonly PathMarker[] =>
  points.map(([x, y], i) => ({ x, y, current: i === 0 }));

export const PATH_FRAME = { landscape: 1366, portrait: 834 } as const;

export const PATH_MARKERS = {
  landscape: marks([
    [40, 186],
    [215, 149],
    [390, 184],
    [580, 134],
    [770, 176],
    [955, 130],
    [1145, 166],
  ]),
  portrait: marks([
    [28, 76],
    [222, 106],
    [418, 108],
    [610, 118],
    [610, 248],
    [414, 248],
    [222, 250],
  ]),
} as const;
