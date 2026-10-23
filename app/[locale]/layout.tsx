import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { SUPPORTED_LOCALES, isSupportedLocale } from "@/lib/locales";
import { readUiStrings } from "@/lib/ui";
import { SiteHeader } from "@/components/SiteHeader";

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
      <SiteHeader locale={locale} ui={ui} />
      <main id="content" className="page" tabIndex={-1}>
        {children}
      </main>
    </>
  );
}
