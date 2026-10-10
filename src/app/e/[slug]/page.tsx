import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { EventPage } from "@/components/event/EventPage";
import { RsvpCard } from "@/components/event/RsvpCard";
import { db } from "@/db";
import { rsvps } from "@/db/schema";
import { rsvpClosedReason, rsvpCookieName, toView, type MyRsvp } from "@/lib/event";
import { closeEndedEvents, getEventBySlug, guestSummary } from "@/lib/queries";
import { siteOrigin } from "@/lib/origin";
import { formatEventDate } from "@/lib/time";
import { and, eq } from "drizzle-orm";

export async function generateMetadata({ params }: PageProps<"/e/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const row = await getEventBySlug(slug);
  if (!row) return {};
  const e = toView(row);
  const date = formatEventDate(e.startsAt, e.endsAt, e.timezone);
  const description = [date && `${date.day}, ${date.times}`, e.locationName].filter(Boolean).join(" · ") || "You're invited!";
  // Link previews only get an image when one was uploaded for that purpose. og:image must be an
  // absolute URL, and the 1200x630 size lets WhatsApp and iMessage draw the large card.
  const image = e.shareImageId
    ? [{ url: `${await siteOrigin()}/api/images/${e.shareImageId}`, width: 1200, height: 630, type: "image/jpeg", alt: e.title }]
    : undefined;
  return {
    title: e.title,
    description,
    // Invites are for people with the link, not for search results.
    robots: { index: false, follow: false },
    openGraph: { type: "website", siteName: "Little RSVP", title: e.title, description, images: image },
    twitter: { card: image ? "summary_large_image" : "summary", title: e.title, description, images: image?.map((i) => i.url) },
  };
}

export default async function EventRoute({ params }: PageProps<"/e/[slug]">) {
  const { slug } = await params;
  await closeEndedEvents();
  const row = await getEventBySlug(slug);
  if (!row) notFound();
  const event = toView(row);

  const token = (await cookies()).get(rsvpCookieName(event.id))?.value;
  const [mine] = token
    ? await db
        .select({ name: rsvps.name, status: rsvps.status, adults: rsvps.adults, kids: rsvps.kids, email: rsvps.email, phone: rsvps.phone, note: rsvps.note })
        .from(rsvps)
        .where(and(eq(rsvps.eventId, event.id), eq(rsvps.editToken, token)))
        .limit(1)
    : [];
  const summary = await guestSummary(event.id);
  const closedReason = rsvpClosedReason(event);

  return (
    <EventPage
      event={event}
      summary={summary}
      rsvp={<RsvpCard slug={event.slug} settings={event.rsvpSettings} mine={(mine as MyRsvp) ?? null} closedReason={closedReason} />}
    />
  );
}
