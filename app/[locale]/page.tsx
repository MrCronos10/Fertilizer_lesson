import Link from "next/link";
import { notFound } from "next/navigation";
import { chapterSlug, readChapters } from "@/lib/content";
import { isSupportedLocale } from "@/lib/locales";
import { readUiStrings } from "@/lib/ui";

export default async function ChapterList({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const ui = readUiStrings(locale);
  const chapters = readChapters(locale);

  return (
    <div className="stack">
      <h1>{ui.siteTitle}</h1>
      <nav aria-label={ui.contents}>
        <h2 className="as-h3">{ui.contents}</h2>
        <ol className="chapter-list">
          {chapters.map(({ frontmatter }) => (
            <li key={frontmatter.chapter}>
              <Link href={`/${locale}/${chapterSlug(frontmatter.chapter)}`}>{frontmatter.heading}</Link>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
