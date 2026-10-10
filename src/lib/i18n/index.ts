// The site speaks one language, chosen in Settings. Dictionaries are plain objects, safe to import
// anywhere (client components included). Read the current language on the server with
// `getI18n()` from "@/lib/i18n/server" and pass `lang` down to client components.

import { en, type Dict } from "./en";
import { es } from "./es";

export type { Dict };

export const LANGS = ["en", "es"] as const;
export type Lang = (typeof LANGS)[number];

/** Each language's name, written in that language, for the Settings picker. */
export const LANG_NAMES: Record<Lang, string> = { en: "English", es: "Español" };

const DICTS: Record<Lang, Dict> = { en, es };

export function isLang(value: unknown): value is Lang {
  return LANGS.includes(value as Lang);
}

export function getDict(lang: string): Dict {
  return isLang(lang) ? DICTS[lang] : en;
}
