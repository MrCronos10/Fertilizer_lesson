import Link from "next/link";
import type { ReactNode } from "react";
import type { UiStrings } from "@/lib/ui";

/**
 * The header of every redesigned chapter after the first (T-044), from Bag-Calculator-Landscape/Portrait.dc.html
 * (and Quiz-*.dc.html, which draw the same parts): a bar with the way back to the contents and "chapter N of 7",
 * then a short band carrying the chapter's own scene, under a card with the chapter badge and the title.
 * Chapter 1 keeps its tall hero (ChapterHero). The scene is decorative and has no text in it (D3).
 */
export function ChapterBand({
  locale,
  ui,
  chapter,
  total,
  title,
  scene,
}: {
  locale: string;
  ui: UiStrings;
  chapter: number;
  total: number;
  title: string;
  scene: ReactNode;
}) {
  return (
    <header className="chapter-band" data-chapter={chapter}>
      <div className="chapter-band-bar">
        <Link className="chapter-band-back" href={`/${locale}`}>
          {ui.contents}
        </Link>
        <span className="chapter-band-count">
          {ui.chapterWord} {chapter} {ui.chapterFrom} {total}
        </span>
      </div>
      <div className="chapter-band-art">
        {scene}
        <div className="chapter-band-card">
          <span className="chapter-badge">
            {ui.chapterWord} {chapter}
          </span>
          <h1>{title}</h1>
        </div>
      </div>
    </header>
  );
}
