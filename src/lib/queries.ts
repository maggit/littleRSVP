import "server-only";
import { and, eq, isNotNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { events, rsvps } from "@/db/schema";
import { DEFAULT_DURATION_HOURS, type GuestSummary } from "./event";

/** Flip active events whose end time has passed to inactive. */
export async function closeEndedEvents() {
  await db
    .update(events)
    .set({ status: "inactive", updatedAt: new Date() })
    .where(
      and(
        eq(events.status, "active"),
        or(isNotNull(events.endsAt), isNotNull(events.startsAt)),
        sql`coalesce(${events.endsAt}, ${events.startsAt} + make_interval(hours => ${DEFAULT_DURATION_HOURS})) < now()`,
      ),
    );
}

export async function getEventBySlug(slug: string) {
  const [row] = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  return row ?? null;
}

export async function getEventById(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [row] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return row ?? null;
}

export async function guestSummary(eventId: string): Promise<GuestSummary> {
  const rows = await db
    .select({ name: rsvps.name, status: rsvps.status, adults: rsvps.adults, kids: rsvps.kids })
    .from(rsvps)
    .where(eq(rsvps.eventId, eventId))
    .orderBy(rsvps.createdAt);
  const going = rows.filter((r) => r.status === "going");
  return {
    goingNames: going.map((r) => r.name.trim().split(/\s+/)[0]),
    going: going.length,
    maybe: rows.filter((r) => r.status === "maybe").length,
    adults: going.reduce((n, r) => n + r.adults, 0),
    kids: going.reduce((n, r) => n + r.kids, 0),
  };
}
