import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { mdxComponents } from "../components/mdx-components";
import { chapterSlug, readChapters } from "./content";
import { UI_KEYS, parseUiStrings, readUiStrings } from "./ui";

const ROOT = process.cwd();
const THAI = /[฀-๿]/u;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(tsx?|css)$/.test(name) ? [path] : [];
  });
}

describe("chapter slugs", () => {
  it("pads to two digits so ch02 and ch10 sort and match their files", () => {
    expect(chapterSlug(1)).toBe("ch01");
    expect(chapterSlug(10)).toBe("ch10");
  });

  it("gives every shipped chapter a distinct slug that matches its file name", () => {
    const chapters = readChapters("th");
    const slugs = chapters.map((c) => chapterSlug(c.frontmatter.chapter));
    expect(new Set(slugs).size).toBe(chapters.length);
    expect(chapters.map((c) => c.file)).toEqual(slugs.map((s) => `${s}.mdx`));
  });
});

describe("MDX slots", () => {
  // A tag with no provided component makes the whole chapter fail to prerender
  // ("Expected component `Quiz` to be defined"), which is what this guards.
  it("provides a component for every capitalised tag any chapter uses", () => {
    const used = new Set(
      readChapters("th").flatMap((c) => [...c.body.matchAll(/<([A-Z][A-Za-z]*)/g)].map((m) => m[1])),
    );
    expect(used.size).toBeGreaterThan(0);
    for (const tag of used) expect(Object.keys(mdxComponents(readUiStrings("th")))).toContain(tag);
  });
});

describe("UI strings", () => {
  it("ships every key for Thai", () => {
    const ui = readUiStrings("th");
    for (const key of UI_KEYS) expect(ui[key]).toMatch(THAI);
  });

  it("rejects a missing, blank or unknown key", () => {
    const good = Object.fromEntries(UI_KEYS.map((k) => [k, "x"]));
    expect(() => parseUiStrings("f", JSON.stringify(good))).not.toThrow();
    expect(() => parseUiStrings("f", JSON.stringify({ ...good, contents: undefined }))).toThrow(/contents/);
    expect(() => parseUiStrings("f", JSON.stringify({ ...good, contents: "  " }))).toThrow(/contents/);
    expect(() => parseUiStrings("f", JSON.stringify({ ...good, extra: "x" }))).toThrow(/extra/);
  });
});

describe("no hard-coded Thai in components", () => {
  // Thai in routes and components must come from ui.json or chapter frontmatter
  // (T-010). Layout metadata and the pre-existing specimen page are exempt.
  const exempt = new Set([join(ROOT, "app/layout.tsx"), join(ROOT, "app/specimen/page.tsx"), join(ROOT, "app/specimen/ThemeToggle.tsx")]);
  const files = [...sourceFiles(join(ROOT, "app")), ...sourceFiles(join(ROOT, "components"))].filter(
    (f) => !exempt.has(f) && f.endsWith(".tsx"),
  );

  it("scans the shell files", () => {
    expect(files.length).toBeGreaterThanOrEqual(5);
  });

  it.each(files.map((f) => [f.slice(ROOT.length + 1), f]))("%s", (_name, file) => {
    expect(readFileSync(file as string, "utf8")).not.toMatch(THAI);
  });
});

describe("Cambodian table", () => {
  it("is never rendered by the SourceTable slot", async () => {
    const { renderToStaticMarkup } = await import("react-dom/server");
    const { SourceTable } = await import("../components/mdx-components");
    const html = renderToStaticMarkup(SourceTable({ id: "rice-by-soil-group-kh" }));
    expect(html).toContain("hidden");
    expect(html).not.toMatch(/<(table|tr|td)/);
  });
});
