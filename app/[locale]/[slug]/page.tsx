import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChapterBody } from "@/components/ChapterBody";
import { chapterSlug, readChapters } from "@/lib/content";
import { SUPPORTED_LOCALES, isSupportedLocale } from "@/lib/locales";
import { readUiStrings } from "@/lib/ui";

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
  return { chapter, previous: chapters[index - 1], next: chapters[index + 1] };
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
  const { chapter, previous, next } = found;

  return (
    <article className="stack">
      <h1>{chapter.frontmatter.heading}</h1>
      <ChapterBody source={chapter.body} />
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
      </nav>
    </article>
  );
}
