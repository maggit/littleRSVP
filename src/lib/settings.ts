import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";

export type SiteSettings = Omit<typeof siteSettings.$inferSelect, "id" | "updatedAt">;

export const defaultSiteSettings: SiteSettings = {
  landingLine1: "Little",
  landingLine2: "RSVP",
  landingDescription: "",
  landingFooter: "",
};

/** The single settings row, or the defaults if nothing has been saved yet. */
export async function getSiteSettings(): Promise<SiteSettings> {
  const [row] = await db
    .select({
      landingLine1: siteSettings.landingLine1,
      landingLine2: siteSettings.landingLine2,
      landingDescription: siteSettings.landingDescription,
      landingFooter: siteSettings.landingFooter,
    })
    .from(siteSettings)
    .where(eq(siteSettings.id, 1))
    .limit(1);
  return row ?? defaultSiteSettings;
}
