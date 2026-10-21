import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CHAPTER_SLUGS, ROUTES, jsBudgetFor } from "./budget";
import { chapterSlug, readChapters } from "./content";

const APP = join(process.cwd(), "app");

/** Every static route the app serves, found from the files, so a new page cannot go unmeasured. */
function pagesUnder(dir: string, prefix: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (!statSync(full).isDirectory() || name.startsWith("_") || name.startsWith("[")) return [];
    const here = `${prefix}/${name}`;
    return [...(readdirSync(full).includes("page.tsx") ? [here] : []), ...pagesUnder(full, here)];
  });
}

describe("the budget covers every route", () => {
  it("lists every static page under app/ (the specimen pages)", () => {
    const found = pagesUnder(APP, "");
    for (const route of found) expect(ROUTES.map((r) => r.path), `${route} has no budget entry`).toContain(route);
  });

  it("lists the language home and every chapter the content directory holds", () => {
    const chapters = readChapters("th").map((c) => `/th/${chapterSlug(c.frontmatter.chapter)}`);
    expect(chapters).toEqual(CHAPTER_SLUGS.map((s) => `/th/${s}`));
    for (const path of ["/th", ...chapters]) expect(ROUTES.map((r) => r.path), path).toContain(path);
  });

  it("has no duplicate or stray entries", () => {
    const paths = ROUTES.map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths.every((p) => p.startsWith("/"))).toBe(true);
  });

  it("holds 3D routes to 600 KB and every other route to 180 KB", () => {
    expect(jsBudgetFor("text")).toBe(180 * 1024);
    expect(jsBudgetFor("3d")).toBe(600 * 1024);
    expect(ROUTES.filter((r) => r.kind === "3d").map((r) => r.path)).toEqual(["/th/ch01", "/specimen-3d", "/specimen-3d-b"]);
  });
});
