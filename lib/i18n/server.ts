import { cookies, headers } from "next/headers";
import { isLocale, LOCALE_COOKIE, matchLocale, type Locale } from "./config";
import { getDictionary, type Dictionary } from "./index";

/**
 * Resolves the active locale for the current request:
 * 1. the visitor's saved choice (cookie set by the switcher), else
 * 2. the browser's Accept-Language ("activate by zone"), else
 * 3. Spanish.
 */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const headerStore = await headers();
  return matchLocale(headerStore.get("accept-language"));
}

export async function getI18n(): Promise<{ locale: Locale; dict: Dictionary }> {
  const locale = await getLocale();
  return { locale, dict: getDictionary(locale) };
}
