"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { LANGS } from "@/lib/i18n";
import { getI18n, zodErrors } from "@/lib/i18n/server";

export async function saveSiteSettings(form: FormData) {
  await requireAdmin();
  const { lang, t } = await getI18n();
  const settingsInput = z.object({
    landingLine1: z.string().trim().min(1, t.settings.line1Required).max(40),
    landingLine2: z.string().trim().max(40),
    landingDescription: z.string().trim().max(200),
    landingFooter: z.string().trim().max(80),
    language: z.enum(LANGS),
  });
  const parsed = settingsInput.safeParse(Object.fromEntries(form), zodErrors(lang));
  if (!parsed.success) {
    redirect(`/admin/settings?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }
  const values = { ...parsed.data, updatedAt: new Date() };
  await db.insert(siteSettings).values({ id: 1, ...values }).onConflictDoUpdate({ target: siteSettings.id, set: values });
  // The language shows up on every page, so refresh everything, not just the landing page.
  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}
