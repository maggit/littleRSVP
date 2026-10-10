"use server";

import { and, count as countRows, eq, ne, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import { rsvps } from "@/db/schema";
import { MAX_GUESTS_PER_KIND, rsvpClosedReason, rsvpCookieName, toView } from "@/lib/event";
import { getEventBySlug } from "@/lib/queries";
import { allow, clientIp } from "@/lib/rate-limit";

export type RsvpState = { ok: boolean; error?: string; at?: number };

const MAX_RSVPS_PER_EVENT = 1000;
// New RSVPs per IP: a household or shared Wi-Fi fits easily, a script doesn't.
const NEW_PER_EVENT = { limit: 6, windowMs: 10 * 60_000 };
const NEW_PER_SITE = { limit: 20, windowMs: 60 * 60_000 };

const count = z.coerce.number().int().min(0).max(MAX_GUESTS_PER_KIND);

const input = z.object({
  slug: z.string().max(100),
  name: z.string().trim().min(1, "Please tell us your name.").max(80),
  status: z.enum(["going", "maybe", "no"]),
  adults: count.default(1),
  kids: count.default(0),
  email: z.string().trim().max(200).regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "That email doesn't look right.").or(z.literal("")).default(""),
  phone: z.string().trim().max(40).default(""),
  note: z.string().trim().max(1000).default(""),
  website: z.string().max(0).optional(), // honeypot
});

export async function submitRsvp(_prev: RsvpState, formData: FormData): Promise<RsvpState> {
  const raw = Object.fromEntries([...formData.entries()].filter(([, v]) => v !== ""));
  const parsed = input.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Something looks off." };
  const data = parsed.data;

  const row = await getEventBySlug(data.slug);
  if (!row) return { ok: false, error: "We couldn't find this party." };
  const event = toView(row);
  const closed = rsvpClosedReason(event);
  if (closed) return { ok: false, error: closed };

  const s = event.rsvpSettings;
  const adults = s.askCounts && data.status !== "no" ? data.adults : data.status === "no" ? 0 : 1;
  const kids = s.askCounts && data.status !== "no" ? data.kids : 0;
  if (data.status !== "no" && adults + kids === 0) return { ok: false, error: "Add at least one guest." };
  const askContact = s.askContact && data.status !== "no";
  const email = askContact ? data.email : "";
  const phone = askContact ? data.phone : "";
  if (phone && phone.replace(/\D/g, "").length < 7) return { ok: false, error: "That phone number doesn't look right." };
  if (askContact && s.contactRequired && !email && !phone) {
    return { ok: false, error: "Please add a phone number or email so we can send updates." };
  }

  const ip = await clientIp();
  const jar = await cookies();
  const token = jar.get(rsvpCookieName(event.id))?.value;
  const values = { name: data.name, status: data.status, adults, kids, email, phone, note: s.askNote ? data.note : "", updatedAt: new Date() };

  // One RSVP at a time per event: without the lock, two guests submitting together can both
  // pass the capacity check and take the last spot.
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${event.id}))`);
    const [existing] = token
      ? await tx.select().from(rsvps).where(and(eq(rsvps.eventId, event.id), eq(rsvps.editToken, token))).limit(1)
      : [];

    // Backstop against bots flooding the table; real guest lists are far smaller.
    if (!existing) {
      if (!allow(`rsvp:${ip}:${event.id}`, NEW_PER_EVENT.limit, NEW_PER_EVENT.windowMs) || !allow(`rsvp:${ip}`, NEW_PER_SITE.limit, NEW_PER_SITE.windowMs)) {
        return { error: "Too many RSVPs from this connection. Please try again in a little while." };
      }
      const [{ n }] = await tx.select({ n: countRows() }).from(rsvps).where(eq(rsvps.eventId, event.id));
      if (n >= MAX_RSVPS_PER_EVENT) return { error: "This party isn't taking more RSVPs online. Please reach out to the host." };
    }

    if (data.status === "going" && event.capacity) {
      const others = await tx
        .select({ adults: rsvps.adults, kids: rsvps.kids })
        .from(rsvps)
        .where(and(eq(rsvps.eventId, event.id), eq(rsvps.status, "going"), existing ? ne(rsvps.id, existing.id) : undefined));
      const taken = others.reduce((n, r) => n + r.adults + r.kids, 0);
      const left = event.capacity - taken;
      if (adults + kids > left) {
        return { error: left > 0 ? `Sorry, only ${left} spot${left === 1 ? "" : "s"} left.` : "Sorry, the party is full. You can still RSVP maybe." };
      }
    }

    if (existing) {
      await tx.update(rsvps).set(values).where(eq(rsvps.id, existing.id));
      return {};
    }
    const editToken = nanoid(32);
    await tx.insert(rsvps).values({ ...values, eventId: event.id, editToken });
    return { newToken: editToken };
  });

  if (result.error) return { ok: false, error: result.error };
  if (result.newToken) {
    jar.set(rsvpCookieName(event.id), result.newToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  revalidatePath(`/e/${event.slug}`);
  return { ok: true, at: Date.now() };
}
