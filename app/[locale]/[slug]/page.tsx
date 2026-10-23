import type { Metadata } from "next";
import "./chapter1.css";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChapterBody } from "@/components/ChapterBody";
import { ChapterHero } from "@/components/ChapterHero";
import { citationEntry } from "@/lib/citations";
import { Sources } from "@/components/Citations";
import { chapterSlug, readChapters } from "@/lib/content";
import { SUPPORTED_LOCALES, isSupportedLocale } from "@/lib/locales";
import type { Tier } from "@/lib/sources";
import { TierBadge } from "@/components/TierBadge";
import { readUiStrings } from "@/lib/ui";

const TIERS: readonly Tier[] = ["official", "research", "commercial"];

type Params = Promise<{ locale: string; slug: string }>;

export function generateStaticParams() {
  return SUPPORTED_LOCALES.flatMap((locale) =>
    readChapters(locale).map(({ frontmatter }) => ({ locale, slug: chapterSlug(frontmatter.chapter) })),
  );
}

function find(locale: string, slug: string) {
  if (!isSupportedLocale(locale)) return null;
  const chapters = readChapters(locale);
  const index = chapters.findIndex((c) => chapterSlug(c.frontmatter.chapter) === slug);
  const chapter = chapters[index];
  if (!chapter) return null;
  return { chapter, previous: chapters[index - 1], next: chapters[index + 1], total: chapters.length };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const found = find(locale, slug);
  return found ? { title: found.chapter.frontmatter.title } : {};
}

export default async function ChapterPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  const found = find(locale, slug);
  if (!found) notFound();
  const ui = readUiStrings(locale as "th");
  const { chapter, previous, next, total } = found;

  const redesigned = chapter.frontmatter.chapter === 1;
  const tiers = TIERS.filter((t) => chapter.frontmatter.citations.some((id) => citationEntry(id).tier === t));
  const sourcesBar = redesigned ? (
    <div className="jump-sources">
      <a href="#sources">
        {ui.jumpToSources}
      </a>
      {tiers.length > 0 ? (
        <span className="tier-legend">
          {ui.tierLegend}
          {tiers.map((t) => (
            <TierBadge key={t} tier={t} ui={ui} />
          ))}
        </span>
      ) : null}
    </div>
  ) : (
    <a className="jump-sources" href="#sources">
      {ui.jumpToSources}
    </a>
  );

  return (
    <article className={redesigned ? "stack chapter-redesign" : "stack"}>
      {redesigned ? (
        <>
          <ChapterHero locale={locale} ui={ui} chapter={chapter.frontmatter.chapter} total={total} heading={chapter.frontmatter.heading} />
          {sourcesBar}
        </>
      ) : (
        <>
          {sourcesBar}
          <h1>{chapter.frontmatter.heading}</h1>
        </>
      )}
      <ChapterBody source={chapter.body} ui={ui} sources={redesigned ? <Sources chapter={chapter} ui={ui} card /> : undefined} />
      {redesigned ? null : <Sources chapter={chapter} ui={ui} />}
      <nav className="chapter-nav" aria-label={ui.chapterNav}>
        {previous ? (
          <Link rel="prev" href={`/${locale}/${chapterSlug(previous.frontmatter.chapter)}`}>
            {ui.previousChapter}: {previous.frontmatter.title}
          </Link>
        ) : null}
        <Link href={`/${locale}`}>{ui.contents}</Link>
        {next ? (
          <Link rel="next" href={`/${locale}/${chapterSlug(next.frontmatter.chapter)}`}>
            {ui.nextChapter}: {next.frontmatter.title}
          </Link>
        ) : null}
        {/* The Chapter-01 artboards' primary button: on into the deficiency explorer (T-041). */}
        {redesigned ? (
          <Link className="chapter-explore" href={`/${locale}/${chapterSlug(chapter.frontmatter.chapter)}/deficiency`}>
            {ui.defExplore}
          </Link>
        ) : null}
      </nav>
    </article>
  );
}
