/** Locales the site serves. Khmer is planned but out of v1 scope (PRD §4). */
export const SUPPORTED_LOCALES = ["th"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "th";

export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
