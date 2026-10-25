"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The header's sources link (T-035, T-056). A chapter page has a sources section to jump to; elsewhere
 * (the home page) the link opens the all-sources page.
 */
export function SourcesLink({ label, href }: { label: string; href: string }) {
  const onChapter = /^\/[^/]+\/ch\d+\/?$/.test(usePathname());
  return onChapter ? (
    <a className="site-link" href="#sources">
      {label}
    </a>
  ) : (
    <Link className="site-link" href={href}>
      {label}
    </Link>
  );
}
