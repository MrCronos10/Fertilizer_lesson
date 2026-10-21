import type { ReactNode } from "react";

/**
 * Slots the chapter MDX uses. Each is a placeholder until the ticket that owns
 * it: citations and tier badges arrive in T-011, and the nine tables render
 * from JSON in T-012 and T-019. They render no invented copy meanwhile.
 */

export function Cite({ id }: { id: string; more?: number }) {
  return (
    <sup className="cite" data-cite={id}>
      <span lang="en">[{id}]</span>
    </sup>
  );
}

export function SourceTable({ id }: { id: string }) {
  // Deliberately empty: the Cambodian table must never reach the page (D11), and
  // no table renders at all until its owning ticket.
  return <div data-source-table={id} hidden />;
}

export function Callout({ type, children }: { type?: string; children: ReactNode }) {
  return (
    <aside className={type === "warn" ? "note" : "panel"} data-callout={type}>
      {children}
    </aside>
  );
}

export function Quiz({ chapter }: { chapter: number }) {
  return <div data-quiz={chapter} hidden />;
}

export const mdxComponents = { Cite, SourceTable, Callout, Quiz };
