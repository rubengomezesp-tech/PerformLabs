// Lightweight i18n core — no external dependency. Locale lives in a cookie
// (set by the visible switcher) and falls back to the browser's Accept-Language,
// then to Spanish. See lib/i18n/server.ts for the request-side resolver.

export const locales = ["es", "en", "pt", "fr", "de", "it", "zh"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "es";

export const LOCALE_COOKIE = "performlabs_locale";
// 1 year, so the visitor's choice (or detected language) sticks.
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Full native names, for the switcher menu. */
export const localeNames: Record<Locale, string> = {
  es: "Español",
  en: "English",
  pt: "Português",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  zh: "中文",
};

/** Short codes, for the compact switcher trigger. */
export const localeShort: Record<Locale, string> = {
  es: "ES",
  en: "EN",
  pt: "PT",
  fr: "FR",
  de: "DE",
  it: "IT",
  zh: "中文",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/**
 * Picks the best supported locale from an Accept-Language header.
 * "fr-CA,fr;q=0.9,en;q=0.8" → "fr". Unsupported tags fall through to Spanish.
 */
export function matchLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return defaultLocale;
  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: (tag || "").toLowerCase(), q: q ? Number(q) : 1 };
    })
    .filter((entry) => entry.tag)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return defaultLocale;
}
