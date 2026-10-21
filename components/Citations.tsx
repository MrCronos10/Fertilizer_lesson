import { citationEntry } from "@/lib/citations";
import type { Chapter } from "@/lib/content";
import type { UiStrings } from "@/lib/ui";
import { TierBadge } from "./TierBadge";

export { TierBadge };

/** Inline citation: links the claim to its entry in the chapter's sources section. */
export function makeCite(ui: UiStrings) {
  return function Cite({ id, more }: { id: string; more?: number }) {
    const entry = citationEntry(id, more);
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

export function Sources({ chapter, ui }: { chapter: Chapter; ui: UiStrings }) {
  const { citations, sourcePages } = chapter.frontmatter;
  const pages = pageRanges(sourcePages);

  return (
    <section id="sources" aria-labelledby="sources-heading" className="sources">
      <h2 id="sources-heading" tabIndex={-1}>
        {ui.sources}
      </h2>
      <p className="muted">
        {ui.pamphletPages}: {pages}
      </p>
      {citations.length > 0 ? (
        <ul className="source-list">
          {citations.map((id) => {
            const entry = citationEntry(id);
            return (
              <li key={id} id={`src-${id}`}>
                <span lang="en">{entry.name}</span> <TierBadge tier={entry.tier} ui={ui} />
                {entry.unnamed > 0 ? ` +${entry.unnamed} ${ui.unnamedSources}` : null}
                {entry.urls.length > 0 ? (
                  <ul>
                    {entry.urls.map((url) => (
                      <li key={url}>
                        <a href={url} rel="noopener noreferrer" lang="en">
                          {url.replace(/^https?:\/\/(www\.)?/, "")}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="muted"> — {ui.noLink}</span>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
