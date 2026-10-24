import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { makeSourceTable } from "../components/SourceTables";
import { glossaryRows } from "./data";
import { readUiStrings } from "./ui";

/** Chapter 6's glossary, drawn at last (T-050): the p14 rows as the data holds them, nothing added. */
const ui = readUiStrings("th");
const html = renderToStaticMarkup(makeSourceTable(ui)({ id: "glossary" }));
const cells = (tr: string) => [...tr.matchAll(/<t[hd][^>]*>(.*?)<\/t[hd]>/g)].map((m) => m[1]!.replace(/<[^>]+>/g, "").trim());

describe("the glossary table", () => {
  it("has the source's header row, Thai, English and Chinese (Khmer is not carried, see the data note)", () => {
    const head = /<thead>(.*?)<\/thead>/.exec(html)![1]!;
    expect(cells(head)).toEqual([ui.colThai, "English", "中文"]);
  });

  it("draws all twenty p14 rows in the data's order, each term word for word", () => {
    const rows = glossaryRows();
    expect(rows).toHaveLength(20);
    const trs = [...html.matchAll(/<tr data-row="([^"]+)"[^>]*>(.*?)<\/tr>/g)];
    expect(trs.map((m) => m[1])).toEqual(rows.map((r) => r.id));
    for (const [i, m] of trs.entries()) {
      const r = rows[i]!;
      expect(cells(m[2]!), r.id).toEqual([r.labels.th, r.labels.en, r.labels.zh]);
      expect(m[0], r.id).toContain('data-source-page="14"');
    }
  });

  it("marks the English and Chinese cells with their language", () => {
    expect((html.match(/<td[^>]*lang="en"/g) ?? []).length).toBe(20);
    expect((html.match(/<td[^>]*lang="zh"/g) ?? []).length).toBe(20);
  });

  it("names its page: 14", () => {
    expect(html).toContain(`${ui.pamphletPages}: 14`);
  });
});
