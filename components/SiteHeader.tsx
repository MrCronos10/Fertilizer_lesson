import Link from "next/link";
import type { UiStrings } from "@/lib/ui";
import { ThemeToggle } from "./ThemeToggle";

/**
 * The site header from the redesign (Main, Home-Portrait, Home-Phone, Home-Night). Shared by every
 * route, so the contents link points at the home page's path. The design's sources link is
 * left out: it points at an all-sources page the site does not have yet.
 * TODO(T-027): add the sources link once an all-sources page exists.
 */
export function SiteHeader({ locale, ui }: { locale: string; ui: UiStrings }) {
  return (
    <header className="site-header">
      <Link className="site-brand" href={`/${locale}`}>
        <svg className="site-mark" viewBox="0 0 30 30" role="img" aria-label={ui.logoLabel}>
          <circle cx="15" cy="15" r="14" />
          <path d="M15 23 C 15 15, 19 10, 24 9 C 24 17, 20 22, 15 23 Z" fill="#F2B632" />
          <path d="M15 23 C 15 17, 12 13, 7 12 C 7 18, 10 22, 15 23 Z" fill="#7FD1A8" />
        </svg>
        <span className="site-title ui">{ui.siteTitle}</span>
      </Link>
      <div className="site-tools">
        <Link className="site-link" href={`/${locale}#chapters`}>
          {ui.contents}
        </Link>
        <ThemeToggle toDark={ui.themeToDark} toLight={ui.themeToLight} />
      </div>
    </header>
  );
}
