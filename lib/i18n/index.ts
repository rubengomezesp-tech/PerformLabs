import { defaultLocale, type Locale } from "./config";
import { es, type Dictionary } from "./dictionaries/es";
import { en } from "./dictionaries/en";
import { pt } from "./dictionaries/pt";
import { fr } from "./dictionaries/fr";
import { de } from "./dictionaries/de";
import { it } from "./dictionaries/it";
import { zh } from "./dictionaries/zh";

// Static map: every language must satisfy the Spanish-derived Dictionary type,
// so a missing key is a compile error rather than a runtime gap.
const dictionaries: Record<Locale, Dictionary> = { es, en, pt, fr, de, it, zh };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

export type { Dictionary };
