import sourcesJson from "@/content/sources.json";
import type { Guidance } from "./data/types";

/**
 * The bibliography the source never printed (T-007, D9).
 *
 * `content/sources.json` is generated from the PDF's own link annotations by
 * `tools/build-sources.py`, so every URL is read rather than guessed. What this
 * module adds is the one judgement D9 asks for: which sources a Rate may be
 * *acted on* from.
 */

export type Tier = "official" | "research" | "commercial";

export interface Domain {
  readonly id: string;
  readonly name: string;
  readonly tier: Tier;
  readonly rationale: string;
  /** How the tier was reached: the host decides it, or only the URL was inspected. */
  readonly basis: "domain" | "inferred-from-url";
  readonly documents: readonly string[];
}

export interface NamedOnlySource {
  readonly id: string;
  readonly name: string;
  readonly tier: Tier;
  readonly url: null;
  readonly citedFor: readonly string[];
  /**
   * Whether this name may lift a rate to actionable. A name counts only where
   * its cell has no pill at all. Beside a pill that belongs to a different
   * line (the cassava cell) it does not, because the page then attaches
   * nothing to the line it names.
   */
  readonly liftsActionability: boolean;
}

export interface Bibliography {
  readonly pillCensus: {
    readonly pills: number;
    readonly documents: number;
    readonly domains: number;
    readonly hiddenBehindOverflow: number;
  };
  readonly domains: readonly Domain[];
  readonly documents: readonly {
    url: string;
    domain: string;
    /** One entry per pill occurrence, so a page repeats when it cites a document twice. */
    pages: readonly number[];
    /** Where each pill sits: its page, and its 0-based position among that page's pills. */
    occurrences: readonly { page: number; index: number }[];
  }[];
  readonly unresolvedOverflow: readonly { anchoredTo: string; page: number; hiddenSources: number }[];
  readonly namedOnly: readonly NamedOnlySource[];
}

export const BIBLIOGRAPHY = sourcesJson as unknown as Bibliography;

const DOMAINS = new Map(BIBLIOGRAPHY.domains.map((d) => [d.id, d]));
const NAMED = new Map(BIBLIOGRAPHY.namedOnly.map((s) => [s.id, s]));

export function domainFor(marker: string): Domain | undefined {
  return DOMAINS.get(marker);
}

export function namedSourceFor(id: string): NamedOnlySource | undefined {
  return NAMED.get(id);
}

/** One source standing behind a piece of guidance. */
export interface Backing {
  readonly kind: "pill" | "named";
  readonly id: string;
  readonly tier: Tier;
  /** Whether it may lift the guidance to actionable. Pills always may. */
  readonly lifts: boolean;
}

/**
 * Every source the page attaches to one piece of guidance.
 *
 * This is resolved per piece of guidance, never per row. A row's Source cell
 * can name three authorities and carry one pill, and the pill belongs to one
 * line of the cell, not to all of them — the cassava cell mixes a Thai rate, a
 * Cambodian note and CIAT regional guidance. Resolving at row level let a
 * commercial-only dolomite rate ride on the CIAT pill.
 */
export function backingFor(guidance: Pick<Guidance, "citations" | "namedSources">): Backing[] {
  const pills = guidance.citations.map((marker): Backing => {
    const domain = domainFor(marker);
    if (!domain) throw new Error(`citation "${marker}" has no entry in sources.json`);
    return { kind: "pill", id: marker, tier: domain.tier, lifts: true };
  });
  const named = guidance.namedSources.map((id): Backing => {
    const source = namedSourceFor(id);
    if (!source) throw new Error(`named source "${id}" has no entry in sources.json`);
    return { kind: "named", id, tier: source.tier, lifts: source.liftsActionability };
  });
  return [...pills, ...named];
}

/**
 * Whether a piece of guidance may feed the calculator or the crop matcher.
 *
 * Two independent conditions, both required:
 *  - the source attributes it to a country the app serves (`UNSTATED` does not
 *    — the vegetable row's only number is an unattributed Cambodian survey,
 *    and `KH` is Cambodian), and
 *  - at least one source the page attaches to it is not merely `commercial`.
 *
 * "At least one" is a strongest-link rule: a single official or research
 * source suffices, and no number of commercial sources adds up to one.
 */
export function isActionable(guidance: Guidance): boolean {
  if (guidance.scope === "UNSTATED" || guidance.scope === "KH") return false;
  return backingFor(guidance).some((b) => b.lifts && b.tier !== "commercial");
}
