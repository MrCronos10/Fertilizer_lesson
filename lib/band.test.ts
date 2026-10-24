import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BAND_SCENE_CHAPTERS, HERO_CHAPTER, bandScene } from "../components/BandScenes";
import { readChapters } from "./content";

const markup = (n: number) => renderToStaticMarkup(bandScene(n) as ReactElement);

/** The redesigned chapters' header bands (T-044). */
describe("band scenes", () => {
  const redesigned = readChapters("th").filter((c) => c.frontmatter.redesign && c.frontmatter.chapter !== HERO_CHAPTER);

  it("every redesigned chapter after the first has its own scene", () => {
    expect(redesigned.length).toBeGreaterThan(0);
    for (const c of redesigned) expect(BAND_SCENE_CHAPTERS, `chapter ${c.frontmatter.chapter}`).toContain(c.frontmatter.chapter);
  });

  it("each scene is decorative: hidden from assistive technology, with no text in it (D3)", () => {
    for (const n of BAND_SCENE_CHAPTERS) {
      const html = markup(n);
      const svgs = [...html.matchAll(/<svg[^>]*>/g)].map((m) => m[0]);
      expect(svgs.length, `chapter ${n}`).toBeGreaterThan(0);
      for (const svg of svgs) expect(svg, `chapter ${n}`).toMatch(/aria-hidden="true"/);
      expect(html, `chapter ${n}`).not.toMatch(/<text|<title|<desc|[\u0E00-\u0E7F]/);
    }
  });

  it("no two scenes share a gradient or pattern id", () => {
    const ids = BAND_SCENE_CHAPTERS.flatMap((n) => [...markup(n).matchAll(/ id="([^"]+)"/g)].map((m) => m[1]));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
