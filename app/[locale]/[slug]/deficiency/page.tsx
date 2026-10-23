import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DefPageExplorer } from "@/components/DefPageExplorer";
import { TierBadge } from "@/components/TierBadge";
import { citationEntry } from "@/lib/citations";
import { chapterSlug } from "@/lib/content";
import { EXPLORER_CHAPTER, RULE_PAGE, deficiencyGroups, ruleScope } from "@/lib/deficiency";
import { SUPPORTED_LOCALES, isSupportedLocale } from "@/lib/locales";
import { readUiStrings } from "@/lib/ui";
import "./deficiency.css";

/** The one chapter this page belongs to: the symptom lines are chapter 1's (pamphlet p2 and p3). */
const CHAPTER_NUMBER = EXPLORER_CHAPTER;
const CHAPTER = chapterSlug(CHAPTER_NUMBER);
/** Where the next link goes: chapter 3, the bag reader. */
const NEXT_CHAPTER = chapterSlug(3);

type Params = Promise<{ locale: string; slug: string }>;

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale, slug: CHAPTER }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isSupportedLocale(locale) || slug !== CHAPTER) return {};
  return { title: readUiStrings(locale).defTableCaption };
}

export default async function DeficiencyPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  if (!isSupportedLocale(locale) || slug !== CHAPTER) notFound();
  const ui = readUiStrings(locale);
  const groups = deficiencyGroups();
  const uga = citationEntry("uga", 2);
  const pages = `${RULE_PAGE}, ${groups.find((g) => g.id === "old")?.entries[0]?.sourcePage}`;

  const sources = (
    <section id="sources" aria-labelledby="def-sources-heading" className="def-sources">
      <h2 id="def-sources-heading" tabIndex={-1}>
        {ui.sources}
      </h2>
      <p>
        <span id="src-uga">
          <span lang="en">{uga.name}</span> <TierBadge tier={uga.tier} ui={ui} />
        </span>
        {uga.unnamed > 0 ? ` +${uga.unnamed} ${ui.unnamedSources}` : null}
        <span className="muted">
          {" · "}
          {ui.pamphletPages}: {pages}
        </span>
      </p>
      {uga.urls.length > 0 ? (
        <ul className="source-list">
          {uga.urls.map((url) => (
            <li key={url}>
              <a href={url} rel="noopener noreferrer" lang="en">
                {url.replace(/^https?:\/\/(www\.)?/, "")}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );

  const rules = (
    <section className="def-rules" aria-labelledby="def-rules-heading">
      <h2 id="def-rules-heading">{ui.defRulesHeading}</h2>
      <div className="def-rule-row" data-group="old">
        <p className="def-rule-name">
          <span className="def-dot" aria-hidden="true" />
          {ui.defOld}
        </p>
        <p>{ruleScope(ui.defRuleOld)}</p>
      </div>
      <div className="def-rule-row" data-group="young">
        <p className="def-rule-name">
          <span className="def-dot" aria-hidden="true" />
          {ui.defYoung}
        </p>
        <p>{ruleScope(ui.defRuleYoung)}</p>
      </div>
    </section>
  );

  const right = (
    <>
      {rules}
      <p className="def-strip">{ui.homeSafeNote}</p>
      <Link className="def-next" href={`/${locale}/${NEXT_CHAPTER}`}>
        {ui.defNext}
      </Link>
    </>
  );

  return (
    <article className="def-page">
      <header className="def-bar">
        <Link className="def-back" href={`/${locale}/${CHAPTER}`}>
          {ui.chapterWord} {CHAPTER_NUMBER}
        </Link>
        <h1>{ui.defTableCaption}</h1>
        <a className="def-bar-sources" href="#sources">
          {ui.sources}
        </a>
      </header>
      <DefPageExplorer
        ui={ui}
        groups={groups}
        source={{ name: uga.name, tier: uga.tier }}
        left={sources}
        right={right}
      />
    </article>
  );
}
