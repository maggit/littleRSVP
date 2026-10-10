"use server";

import { and, eq, ne } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signOut } from "@/auth";
import { db } from "@/db";
import { events, rsvps } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import type { Dict } from "@/lib/i18n";
import { getI18n, zodErrors } from "@/lib/i18n/server";
import { pruneImages, sweepStaleImages } from "@/lib/images";
import { defaultRsvpSettings, defaultSections, rsvpSettingsSchema, sectionSchema } from "@/lib/sections";
import { EFFECTS, THEMES } from "@/lib/themes";
import { zonedLocalToDate } from "@/lib/time";
import { TITLE_FONTS } from "@/lib/title-fonts";

export async function logout() {
  await signOut({ redirectTo: "/admin/login" });
}

export async function createEvent() {
  await requireAdmin();
  // Starting copy is written in the current site language; after that it's the host's text.
  const { t } = await getI18n();
  const [row] = await db
    .insert(events)
    .values({
      slug: `party-${nanoid(6).toLowerCase().replace(/[^a-z0-9]/g, "x")}`,
      title: t.defaults.title,
      subtitle: t.defaults.subtitle,
      hostedBy: "",
      sections: defaultSections(t),
      rsvpSettings: defaultRsvpSettings(t),
    })
    .returning({ id: events.id });
  redirect(`/admin/events/${row.id}`);
}

const localDate = z.string().max(20).nullable();

const eventInput = (t: Dict) => z.object({
  title: z.string().trim().min(1, t.errors.title).max(140),
  badge: z.string().trim().max(60),
  tagline: z.string().trim().max(160),
  subtitle: z.string().trim().max(1000),
  arrivalNote: z.string().trim().max(1000),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, t.errors.slugShort)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, t.errors.slugChars),
  status: z.enum(["active", "inactive"]),
  startsLocal: localDate,
  endsLocal: localDate,
  timezone: z.string().max(60).refine((tz) => {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, t.errors.timezone),
  hostedBy: z.string().trim().max(120),
  locationName: z.string().trim().max(200),
  locationAddress: z.string().trim().max(300),
  capacity: z.number().int().min(1).max(10000).nullable(),
  theme: z.enum(Object.keys(THEMES) as [string, ...string[]]),
  effect: z.enum([...EFFECTS] as [string, ...string[]]),
  titleFont: z.enum(Object.keys(TITLE_FONTS) as [string, ...string[]]),
  coverImageId: z.uuid().nullable(),
  shareImageId: z.uuid().nullable(),
  coverEmoji: z.string().max(16),
  sections: z.array(sectionSchema).max(40),
  rsvpSettings: rsvpSettingsSchema.extend({ deadline: localDate }),
});

export type EventInput = z.input<ReturnType<typeof eventInput>>;
export type SaveResult = { ok: true; savedAt: number } | { ok: false; error: string };

export async function saveEvent(id: string, input: EventInput): Promise<SaveResult> {
  await requireAdmin();
  const { lang, t } = await getI18n();
  const parsed = eventInput(t).safeParse(input, zodErrors(lang));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue ? `${issue.message}${issue.path.length ? ` (${issue.path.join(".")})` : ""}` : t.errors.invalid };
  }
  const d = parsed.data;
  const startsAt = d.startsLocal ? zonedLocalToDate(d.startsLocal, d.timezone) : null;
  const endsAt = d.endsLocal ? zonedLocalToDate(d.endsLocal, d.timezone) : null;
  if (startsAt && endsAt && endsAt <= startsAt) return { ok: false, error: t.errors.endBeforeStart };
  const deadline = d.rsvpSettings.deadline ? zonedLocalToDate(d.rsvpSettings.deadline, d.timezone) : null;

  const [clash] = await db.select({ id: events.id }).from(events).where(and(eq(events.slug, d.slug), ne(events.id, id))).limit(1);
  if (clash) return { ok: false, error: t.errors.slugTaken(d.slug) };

  const [before] = await db.select({ slug: events.slug, coverImageId: events.coverImageId, shareImageId: events.shareImageId }).from(events).where(eq(events.id, id)).limit(1);
  if (!before) return { ok: false, error: t.errors.gone };

  await db
    .update(events)
    .set({
      title: d.title,
      badge: d.badge,
      tagline: d.tagline,
      subtitle: d.subtitle,
      arrivalNote: d.arrivalNote,
      slug: d.slug,
      status: d.status,
      startsAt,
      endsAt,
      timezone: d.timezone,
      hostedBy: d.hostedBy,
      locationName: d.locationName,
      locationAddress: d.locationAddress,
      capacity: d.capacity,
      theme: d.theme,
      effect: d.effect,
      titleFont: d.titleFont,
      coverImageId: d.coverImageId,
      shareImageId: d.shareImageId,
      coverEmoji: d.coverEmoji,
      sections: d.sections,
      rsvpSettings: { ...d.rsvpSettings, deadline: deadline?.toISOString() ?? null },
      updatedAt: new Date(),
    })
    .where(eq(events.id, id));

  // Images this save replaced or removed are no longer needed, and shouldn't stay reachable by URL.
  await pruneImages([before.coverImageId, before.shareImageId]);
  await sweepStaleImages();

  revalidatePath(`/e/${before.slug}`);
  revalidatePath(`/e/${d.slug}`);
  revalidatePath("/admin");
  return { ok: true, savedAt: Date.now() };
}

export async function setEventStatus(id: string, status: "active" | "inactive") {
  await requireAdmin();
  const [row] = await db.update(events).set({ status, updatedAt: new Date() }).where(eq(events.id, id)).returning({ slug: events.slug });
  if (row) revalidatePath(`/e/${row.slug}`);
  revalidatePath("/admin");
}

export async function duplicateEvent(id: string) {
  await requireAdmin();
  const { t } = await getI18n();
  const [src] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!src) return;
  const [row] = await db
    .insert(events)
    .values({
      ...src,
      id: undefined,
      slug: `${src.slug.slice(0, 70)}-${nanoid(4).toLowerCase().replace(/[^a-z0-9]/g, "x")}`,
      title: t.defaults.copy(src.title),
      status: "active",
      startsAt: null,
      endsAt: null,
      rsvpSettings: { ...src.rsvpSettings, deadline: null },
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({ id: events.id });
  redirect(`/admin/events/${row.id}`);
}

export async function deleteEvent(id: string) {
  await requireAdmin();
  const [row] = await db.delete(events).where(eq(events.id, id)).returning({ slug: events.slug, coverImageId: events.coverImageId, shareImageId: events.shareImageId });
  if (row) {
    await pruneImages([row.coverImageId, row.shareImageId]);
    revalidatePath(`/e/${row.slug}`);
  }
  redirect("/admin");
}

export async function deleteRsvp(eventId: string, rsvpId: string) {
  await requireAdmin();
  const [row] = await db.select({ slug: events.slug }).from(events).where(eq(events.id, eventId)).limit(1);
  await db.delete(rsvps).where(and(eq(rsvps.id, rsvpId), eq(rsvps.eventId, eventId)));
  if (row) revalidatePath(`/e/${row.slug}`);
  revalidatePath(`/admin/events/${eventId}/rsvps`);
}
