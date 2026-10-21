import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { SUPPORTED_LOCALES, isSupportedLocale } from "@/lib/locales";
import { readUiStrings } from "@/lib/ui";

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const ui = readUiStrings(locale);

  return (
    <>
      <a className="skip-link" href="#content">
        {ui.skipToContent}
      </a>
      <header className="site-header page">
        <Link className="site-title ui" href={`/${locale}`}>
          {ui.siteTitle}
        </Link>
      </header>
      <main id="content" className="page" tabIndex={-1}>
        {children}
      </main>
    </>
  );
}
