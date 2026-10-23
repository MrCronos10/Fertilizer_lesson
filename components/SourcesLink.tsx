"use client";

import { usePathname } from "next/navigation";

/**
 * The header's sources link (T-035). A chapter page has a sources section to jump to; the home page
 * does not, and the site has no all-sources page yet, so there the link is left out rather than left dead.
 */
export function SourcesLink({ label }: { label: string }) {
  const onChapter = /^\/[^/]+\/ch\d+\/?$/.test(usePathname());
  return onChapter ? (
    <a className="site-link" href="#sources">
      {label}
    </a>
  ) : null;
}
