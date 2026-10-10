"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";

const settingsInput = z.object({
  landingLine1: z.string().trim().min(1, "The first line can't be empty.").max(40),
  landingLine2: z.string().trim().max(40),
  landingDescription: z.string().trim().max(200),
  landingFooter: z.string().trim().max(80),
});

export async function saveSiteSettings(form: FormData) {
  await requireAdmin();
  const parsed = settingsInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    redirect(`/admin/settings?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }
  const values = { ...parsed.data, updatedAt: new Date() };
  await db.insert(siteSettings).values({ id: 1, ...values }).onConflictDoUpdate({ target: siteSettings.id, set: values });
  revalidatePath("/");
  redirect("/admin/settings?saved=1");
}
