import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const FONT_DIR = join(process.cwd(), "public", "fonts");
const FONT_CSS = join(process.cwd(), "app", "fonts.css");

/** D16: Thai fonts subset to Thai + Latin, each <= 60 KB woff2. */
const BUDGET_BYTES = 60 * 1024;

describe("font budget", () => {
  const files = readdirSync(FONT_DIR).filter((f) => f.endsWith(".woff2"));

  it("ships the expected faces", () => {
    expect(files.sort()).toEqual([
      "noto-sans-thai-700-latin.woff2",
      "noto-sans-thai-700-thai.woff2",
      "sarabun-400-latin.woff2",
      "sarabun-400-thai.woff2",
      "sarabun-600-latin.woff2",
      "sarabun-600-thai.woff2",
    ]);
  });

  it.each(files)("%s is within the 60 KB budget", (file) => {
    const { byteLength } = readFileSync(join(FONT_DIR, file));
    expect(byteLength).toBeLessThanOrEqual(BUDGET_BYTES);
  });

  it.each(files)("%s is a real woff2 file", (file) => {
    // wOF2 magic number: a truncated or HTML-error-page download fails here.
    expect(readFileSync(join(FONT_DIR, file)).subarray(0, 4).toString("latin1")).toBe("wOF2");
  });

  it("references only fonts that exist", () => {
    const css = readFileSync(FONT_CSS, "utf8");
    const referenced = [...css.matchAll(/url\("\/fonts\/([^"]+)"\)/g)].map((m) => m[1]);

    expect(referenced.length).toBeGreaterThan(0);
    for (const ref of referenced) {
      expect(files).toContain(ref);
    }
  });

  it("keeps ZWNJ/ZWJ and the dotted-circle carrier in the Thai range", () => {
    const css = readFileSync(FONT_CSS, "utf8");
    const thaiRanges = [...css.matchAll(/unicode-range: ([^;]*U\+0E01-0E5B[^;]*);/g)].map(
      (m) => m[1],
    );

    expect(thaiRanges.length).toBe(3);
    for (const range of thaiRanges) {
      expect(range).toContain("U+200C-200D");
      expect(range).toContain("U+25CC");
    }
  });
});
