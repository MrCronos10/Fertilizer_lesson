import type { ReactNode } from "react";
import { citationEntry, type CitationEntry } from "@/lib/citations";
import type { Chapter } from "@/lib/content";
import type { UiStrings } from "@/lib/ui";
import { TierBadge } from "./TierBadge";

export { TierBadge };

/** Inline citation: links the claim to its entry in the chapter's sources section. */
export function makeCite(ui: UiStrings) {
  return function Cite({ id, more, block }: { id: string; more?: number; block?: boolean }) {
    const entry = citationEntry(id, more);
    // The redesigned chapter 1 (T-029) puts the source on its own line under the block, as the artboard does.
    if (block)
      return (
        <p className="cite-line">
          <span className="muted">{ui.sourceLabel}</span>
          <a href={`#src-${id}`} data-cite={id} lang="en">
            {entry.name}
          </a>
          <TierBadge tier={entry.tier} ui={ui} />
          {entry.unnamed > 0 ? (
            <a href="#sources" className="cite-more">
              {ui.moreFrom} {entry.unnamed} {ui.moreUnit}
            </a>
          ) : null}
        </p>
      );
    return (
      <sup className="cite">
        <a href={`#src-${id}`} data-cite={id}>
          <span className="visually-hidden">{ui.sources}: </span>
          <span lang="en">{entry.name}</span> <TierBadge tier={entry.tier} ui={ui} />
          {entry.unnamed > 0 ? ` +${entry.unnamed}` : null}
        </a>
      </sup>
    );
  };
}

/** `[3,4,5,9]` → `3–5, 9`: a gap is never papered over by a range. */
export function pageRanges(pages: readonly number[]): string {
  const sorted = [...new Set(pages)].sort((a, b) => a - b);
  const runs: number[][] = [];
  for (const p of sorted) {
    const run = runs[runs.length - 1];
    if (run && p === run[run.length - 1]! + 1) run.push(p);
    else runs.push([p]);
  }
  return runs.map((r) => (r.length > 1 ? `${r[0]}–${r[r.length - 1]}` : `${r[0]}`)).join(", ");
}

/**
 * A document link's text: no scheme or "www.", and readable, so a Thai path shows as Thai, not as %E0%B8… (the href is
 * the document's own). The address up to its first Thai letter is marked English; the Thai after it is not.
 */
function DocumentLink({ url }: { url: string }) {
  const bare = url.replace(/^https?:\/\/(www\.)?/, "");
  let text = bare;
  try {
    text = decodeURI(bare);
  } catch {}
  const cut = text.search(/[^\x20-\x7e]/);
  return cut < 0 ? (
    <a href={url} rel="noopener noreferrer" lang="en">
      {text}
    </a>
  ) : (
    <a href={url} rel="noopener noreferrer">
      <span lang="en">{text.slice(0, cut)}</span>
      {text.slice(cut)}
    </a>
  );
}

/**
 * One source as a sources list shows it: its name, the count its pill hides, and its documents or "no link". A chapter
 * shows its tier beside it; the all-sources page (T-055) lists by tier, so it does not, and adds lines of its own.
 */
export function SourceItem({ entry, ui, tier = true, children }: { entry: CitationEntry; ui: UiStrings; tier?: boolean; children?: ReactNode }) {
  return (
    <li id={`src-${entry.id}`}>
      <span lang="en">{entry.name}</span>
      {tier ? (
        <>
          {" "}
          <TierBadge tier={entry.tier} ui={ui} />
        </>
      ) : null}
      {entry.unnamed > 0 ? ` +${entry.unnamed} ${ui.unnamedSources}` : null}
      {entry.urls.length > 0 ? (
        <ul>
          {entry.urls.map((url) => (
            <li key={url}>
              <DocumentLink url={url} />
            </li>
          ))}
        </ul>
      ) : (
        <span className="muted"> — {ui.noLink}</span>
      )}
      {children}
    </li>
  );
}

export function Sources({ chapter, ui, card }: { chapter: Chapter; ui: UiStrings; card?: boolean }) {
  const { citations, sourcePages } = chapter.frontmatter;
  const pages = pageRanges(sourcePages);

  return (
    <section id="sources" aria-labelledby="sources-heading" className={card ? "sources sources-card" : "sources"}>
      <h2 id="sources-heading" tabIndex={-1}>
        {ui.sources}
      </h2>
      <p className="muted">
        {ui.pamphletPages}: {pages}
      </p>
      {citations.length > 0 ? (
        <ul className="source-list">
          {citations.map((id) => (
            <SourceItem key={id} entry={citationEntry(id)} ui={ui} />
          ))}
        </ul>
      ) : null}
      {card ? <p className="safe-strip">{ui.homeSafeNote}</p> : null}
    </section>
  );
}
