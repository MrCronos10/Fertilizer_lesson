import { citationEntry, TIERS, type CitationEntry } from "./citations";
import { readChapters } from "./content";
import { cropChoices } from "./crop-matcher";
import { RAW_TABLES } from "./data";
import { BIBLIOGRAPHY, namedSourceFor, type Tier } from "./sources";

/** A chapter that shows a source: `anchored` when its sources list has an entry for it to land on. */
export interface ChapterLink {
  readonly chapter: number;
  readonly anchored: boolean;
}

/**
 * One source on the all-sources page (T-055). Pages and chapters are only what the data says: the pamphlet pages of a
 * source's documents and the table rows that name it, and the chapters that show it.
 */
export interface SourceListing {
  /** Its name, tier, documents and hidden count, as a chapter's sources list shows them. */
  readonly entry: CitationEntry;
  /** The pamphlet pages its documents are cited on, or its name is printed on, sorted, each once. */
  readonly pages: readonly number[];
  /** In chapter order; none when no chapter shows it (it is cited only in the pamphlet). */
  readonly chapters: readonly ChapterLink[];
}

/** What a chapter shows: the sources its sources list has (`citations`), and those it names without one (`shown`). */
export interface ChapterSources {
  readonly chapter: number;
  readonly citations: readonly string[];
  readonly shown?: readonly string[];
}

/**
 * Every source the pamphlet cites, grouped by tier as the chapters' tier legend is. Each linked domain is listed once
 * with all its documents, and each source named without a link once; a name that is also a domain is the domain's
 * entry, as `citationEntry` resolves it.
 */
export function allSources(
  chapters: readonly ChapterSources[],
  namedOn: readonly { readonly id: string; readonly page: number }[] = [],
): readonly { readonly tier: Tier; readonly sources: readonly SourceListing[] }[] {
  const ids = [
    ...BIBLIOGRAPHY.domains.map((d) => d.id),
    ...BIBLIOGRAPHY.namedOnly.map((n) => n.id).filter((id) => !BIBLIOGRAPHY.domains.some((d) => d.id === id)),
  ];
  // Resolving every chapter's sources first makes an unknown one fail, as it does on the chapter page.
  for (const c of chapters) for (const id of [...c.citations, ...(c.shown ?? [])]) citationEntry(id);

  const listings = ids.map((id): SourceListing => {
    const entry = citationEntry(id);
    const pages = [
      ...BIBLIOGRAPHY.documents.filter((d) => d.domain === id).flatMap((d) => d.pages),
      ...namedOn.filter((n) => n.id === id).map((n) => n.page),
    ];
    return {
      entry,
      pages: [...new Set(pages)].sort((a, b) => a - b),
      chapters: chapters
        .filter((c) => c.citations.includes(id) || c.shown?.includes(id))
        .map((c) => ({ chapter: c.chapter, anchored: c.citations.includes(id) }))
        .sort((a, b) => a.chapter - b.chapter),
    };
  });
  const byName = (a: SourceListing, b: SourceListing) => a.entry.name.localeCompare(b.entry.name, "en", { sensitivity: "base" });
  return TIERS.map((tier) => ({ tier, sources: listings.filter((s) => s.entry.tier === tier).sort(byName) }));
}

/**
 * The pages the tables print a source's name on, with no link or pill (the p12–13 Source cells). Reads only source ids
 * and page numbers from the raw rows, never a rate, so the country filter `RAW_TABLES` warns about does not apply: the
 * pamphlet names these sources whoever reads it.
 */
export function namedSourcePages(): readonly { id: string; page: number }[] {
  const found: { id: string; page: number }[] = [];
  const walk = (value: unknown, page: number) => {
    if (Array.isArray(value)) for (const v of value) walk(v, page);
    else if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;
      if (Array.isArray(record.namedSources)) for (const id of record.namedSources as string[]) if (namedSourceFor(id)) found.push({ id, page });
      for (const v of Object.values(record)) walk(v, page);
    }
  };
  for (const table of Object.values(RAW_TABLES)) for (const row of table.rows) walk(row, row.sourcePage);
  return found;
}

/**
 * What each chapter shows, for `allSources`: its sources list, and for chapter 5 the sources its crop matcher names
 * without an entry in that list (named-only sources, and pills printed on other pages), as the matcher shows them to
 * this audience.
 */
export function chapterSources(locale: string): readonly ChapterSources[] {
  const matcher = cropChoices(locale).flatMap((crop) =>
    crop.rows.flatMap((row) => row.stages.flatMap((s) => [...s.actionable, ...s.descriptive]).flatMap((g) => g.sources)),
  );
  const shown = [...new Set(matcher.filter((chip) => !chip.linked).map((chip) => chip.id))];
  return readChapters(locale).map(({ frontmatter }) => ({
    chapter: frontmatter.chapter,
    citations: frontmatter.citations,
    ...(frontmatter.tables.includes("other-crops") ? { shown } : {}),
  }));
}
