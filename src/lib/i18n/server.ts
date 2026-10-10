import "server-only";
import { connection } from "next/server";
import { z } from "zod";
import { getSiteSettings } from "@/lib/settings";
import { getDict, isLang, type Dict, type Lang } from ".";

/** The site language from Settings. Waits for a request, so callers never run at build time. */
export async function getLang(): Promise<Lang> {
  await connection();
  const { language } = await getSiteSettings();
  return isLang(language) ? language : "en";
}

export async function getI18n(): Promise<{ lang: Lang; t: Dict }> {
  const lang = await getLang();
  return { lang, t: getDict(lang) };
}

const ZOD_LOCALES: Record<Lang, () => { localeError: z.core.$ZodErrorMap }> = { en: z.locales.en, es: z.locales.es };

/** Parse options that put zod's built-in messages (too long, wrong type…) in the site language. */
export function zodErrors(lang: Lang) {
  return { error: ZOD_LOCALES[lang]().localeError };
}
