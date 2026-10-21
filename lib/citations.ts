import { domainFor, namedSourceFor, BIBLIOGRAPHY, type Tier } from "./sources";

/**
 * One citation as the page shows it: a name, a tier, and the documents behind
 * it. Domains carry URLs (read from the PDF's link annotations); named-only
 * sources are authorities the source printed without a link.
 */
export interface CitationEntry {
  readonly id: string;
  readonly name: string;
  readonly tier: Tier;
  readonly urls: readonly string[];
  /** Sources hidden behind an overflow pill (`uga +2`): counted, never named. */
  readonly unnamed: number;
}

export const TIERS: readonly Tier[] = ["official", "research", "commercial"];

/** Throws on an unknown marker: a citation that resolves to nothing must fail the build. */
export function citationEntry(id: string, more = 0): CitationEntry {
  const domain = domainFor(id);
  const named = namedSourceFor(id);
  const entry = domain
    ? { name: domain.name, tier: domain.tier, urls: domain.documents }
    : named
      ? { name: named.name, tier: named.tier, urls: [] as readonly string[] }
      : null;
  if (!entry) throw new Error(`citation "${id}" has no entry in sources.json`);
  const hidden = BIBLIOGRAPHY.unresolvedOverflow.find((o) => o.anchoredTo === id);
  return { id, ...entry, unnamed: more || (hidden?.hiddenSources ?? 0) };
}
