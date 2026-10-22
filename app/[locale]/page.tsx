import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { HeroScene } from "@/components/HeroScene";
import { ChapterTrail, HeroField, SoilCard } from "@/components/HomeArt";
import { chapterSlug, readChapters } from "@/lib/content";
import { nutrientGroupRows } from "@/lib/data";
import { ELEMENTS, HERO_MODE_SCRIPT, PATH_FRAME, PATH_MARKERS, npkRoles } from "@/lib/home";
import { isSupportedLocale } from "@/lib/locales";
import { readUiStrings } from "@/lib/ui";
import "./home.css";

const LEADERS_ID = "hero-leaders";

/**
 * The home page (T-027): one route for every width, drawn from Main (iPad landscape),
 * Home-Portrait, Home-Phone, Home-Night and Home-Hero-Fallback. Everything a reader needs is in
 * this server-rendered HTML; the 3D block is an extra layered under the labels (Layer-Stack).
 */
export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const ui = readUiStrings(locale);
  const chapters = readChapters(locale);
  const roles = npkRoles(nutrientGroupRows().find((row) => row.id === "macronutrients")!);
  const names = { N: ui.npkNameN, P: ui.npkNameP, K: ui.npkNameK };
  const first = `/${locale}/${chapterSlug(1)}`;

  return (
    <div className="home">
      {/* Before the hero is parsed: picks the live or the flat hero so the layout never swaps after paint. */}
      <script dangerouslySetInnerHTML={{ __html: HERO_MODE_SCRIPT }} />

      <section className="hero" aria-labelledby="home-title">
        <div className="hero-field">
          <HeroField />
        </div>
        <div className="hero-inner">
          <div className="hero-copy">
            <h1 id="home-title" className="hero-title">
              {ui.siteTitle}
            </h1>
            <p className="hero-lead hero-lead-long">{ui.homeTagline}</p>
            <p className="hero-lead hero-lead-short">{ui.homeTaglineShort}</p>
            <div className="hero-actions">
              <Link className="cta cta-primary" href={first}>
                {ui.homeStart}
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <path d="M3 9h11M9.5 4.5L14 9l-4.5 4.5" />
                </svg>
              </Link>
              <a className="cta cta-secondary" href="#chapters">
                {ui.homeSeeAll}
              </a>
            </div>
            <p className="hero-cited">
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path d="M9 1.8l6 2.6v4.2c0 3.6-2.5 6.2-6 7.6-3.5-1.4-6-4-6-7.6V4.4z" />
                <path d="M6.2 9.1l2 2 3.6-3.8" />
              </svg>
              <span>{ui.homeCited}</span>
            </p>
          </div>

          <div className="hero-stage">
            <SoilCard />
            <HeroScene label={ui.defSceneLabel} leadersId={LEADERS_ID} />
          </div>

          <svg id={LEADERS_ID} className="hero-leaders" aria-hidden="true">
            {ELEMENTS.map((e) => (
              <path key={e} data-leader={e} />
            ))}
          </svg>

          {/* Visually hidden on a phone, where the design shows one pill instead; home.css shows it from 40em. */}
          <ul className="npk-labels visually-hidden">
            {ELEMENTS.map((e) => (
              <li key={e} className="npk-label" data-label={e}>
                <span className={`npk-chip npk-${e.toLowerCase()}`} aria-hidden="true">
                  {e}
                </span>
                <span className="npk-text">
                  <span className="npk-name">
                    {names[e]} <span className="visually-hidden">({e})</span>
                  </span>
                  <span className="npk-role">{roles[e]}</span>
                </span>
              </li>
            ))}
          </ul>

          <p className="npk-pill">
            <span className="npk-pill-chips" aria-hidden="true">
              {ELEMENTS.map((e) => (
                <span key={e} className={`npk-chip npk-${e.toLowerCase()}`}>
                  {e}
                </span>
              ))}
            </span>
            <span>{ui.homeMacro}</span>
          </p>

          <p className="hero-hint" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M2 8h12M5 5L2 8l3 3M11 5l3 3-3 3" />
            </svg>
            <span>{ui.homeDragHint}</span>
          </p>
        </div>
      </section>

      <nav id="chapters" className="chapters" aria-label={ui.contents}>
        <div className="chapters-inner">
          <ChapterTrail />
          <div className="chapters-head">
            <h2 className="chapters-title">{ui.contents}</h2>
            <span className="chapters-count chapters-count-long">{ui.homeChapterCount}</span>
            <span className="chapters-count chapters-count-short">{ui.homeChapterCountShort}</span>
          </div>
          <ol className="chapter-markers">
            {chapters.map(({ frontmatter }, i) => {
              const at = (layout: keyof typeof PATH_MARKERS) => PATH_MARKERS[layout][i] ?? PATH_MARKERS[layout][0]!;
              const style = {
                "--lx": `${(at("landscape").x / PATH_FRAME.landscape) * 100}%`,
                "--ly": `${at("landscape").y}px`,
                "--px": `${(at("portrait").x / PATH_FRAME.portrait) * 100}%`,
                "--py": `${at("portrait").y}px`,
              } as CSSProperties;
              const current = i === 0;
              return (
                <li key={frontmatter.chapter} className="marker-item" style={style}>
                  <Link className={current ? "marker marker-current" : "marker"} href={`/${locale}/${chapterSlug(frontmatter.chapter)}`}>
                    {current ? <span className="marker-here">{ui.homeHere}</span> : null}
                    <span className="marker-dot" aria-hidden="true">
                      {frontmatter.chapter}
                    </span>
                    <span className="marker-title" aria-hidden="true">
                      {frontmatter.title}
                    </span>
                    <span className="visually-hidden">{frontmatter.heading}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </nav>

      {/* TODO(T-027): the design's all-sources link belongs here once an all-sources page exists. */}
      <aside className="safe-note">
        <p>
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            <circle cx="11" cy="11" r="9" />
            <path d="M11 6.4v5.4" />
            <path d="M11 15.2v0.1" />
          </svg>
          <span>{ui.homeSafeNote}</span>
        </p>
      </aside>
    </div>
  );
}
