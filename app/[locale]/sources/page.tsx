import type { Metadata } from "next";
import "../[slug]/chapter.css";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChapterBand } from "@/components/ChapterBand";
import { pageRanges, SourceItem } from "@/components/Citations";
import { TierBadge } from "@/components/TierBadge";
import { allSources, chapterSources, namedSourcePages } from "@/lib/all-sources";
import { TIERS } from "@/lib/citations";
import { chapterSlug } from "@/lib/content";
import { SUPPORTED_LOCALES, isSupportedLocale } from "@/lib/locales";
import { readUiStrings } from "@/lib/ui";

type Params = Promise<{ locale: string }>;

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  return isSupportedLocale(locale) ? { title: readUiStrings(locale).allSources } : {};
}

/**
 * Every source the pamphlet cites, grouped by tier (T-055): the target of the home page's two sources links. No
 * artboard draws it, so it is built from the chapters' parts: their band without a scene, the tier legend in their
 * sources bar, a card per tier listing sources as their sources sections do, and the soil-test strip. Its only words
 * are ones the site already has, and its title, which is the home safety strip's button in Main.dc.html.
 */
export default async function AllSourcesPage({ params }: { params: Params }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const ui = readUiStrings(locale);
  const groups = allSources(chapterSources(locale), namedSourcePages());

  return (
    <article className="stack chapter-redesign all-sources">
      <ChapterBand locale={locale} ui={ui} title={ui.allSources} />
      <div className="jump-sources">
        <span className="tier-legend">
          {ui.tierLabel}
          {TIERS.map((t) => (
            <TierBadge key={t} tier={t} ui={ui} />
          ))}
        </span>
      </div>
      {groups.map(({ tier, sources }) => (
        <section key={tier} className="chapter-card" data-tier={tier} aria-labelledby={`tier-${tier}`}>
          <h2 id={`tier-${tier}`}>
            <TierBadge tier={tier} ui={ui} />
          </h2>
          <ul className="source-list">
            {sources.map((s) => (
              <SourceItem key={s.entry.id} entry={s.entry} ui={ui} tier={false}>
                {s.pages.length > 0 ? (
                  <p className="source-pages muted">
                    {ui.pamphletPages}: {pageRanges(s.pages)}
                  </p>
                ) : null}
                {s.chapters.length > 0 ? (
                  <p className="source-chapters">
                    {/* Onto the source's entry in the chapter's sources list; to the chapter itself where it has none
                        (chapter 5's crop matcher names sources its list does not hold). */}
                    {s.chapters.map(({ chapter, anchored }) => (
                      <Link key={chapter} href={`/${locale}/${chapterSlug(chapter)}${anchored ? `#src-${s.entry.id}` : ""}`}>
                        {ui.chapterWord} {chapter}
                      </Link>
                    ))}
                  </p>
                ) : null}
              </SourceItem>
            ))}
          </ul>
        </section>
      ))}
      <p className="safe-strip">{ui.homeSafeNote}</p>
      <nav className="chapter-nav" aria-label={ui.chapterNav}>
        <Link href={`/${locale}`}>{ui.contents}</Link>
      </nav>
    </article>
  );
}
