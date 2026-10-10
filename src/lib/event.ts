import type { EventRow } from "@/db/schema";
import type { RsvpSettings, Section } from "./sections";

/** Serializable event shape shared by the public page, the editor preview, and server code. */
export type EventView = {
  id: string;
  slug: string;
  title: string;
  /** Small pill above the title, e.g. "A pop star birthday". */
  badge: string;
  /** One line under the title. */
  tagline: string;
  /** Intro text shown in a card above the event details. */
  subtitle: string;
  /** Arrival instructions shown under the event details. */
  arrivalNote: string;
  status: "active" | "inactive";
  startsAt: string | null;
  endsAt: string | null;
  timezone: string;
  hostedBy: string;
  locationName: string;
  locationAddress: string;
  capacity: number | null;
  theme: string;
  effect: string;
  titleFont: string;
  coverImageId: string | null;
  /** Link-preview image (og:image); null means no preview image. */
  shareImageId: string | null;
  coverEmoji: string;
  sections: Section[];
  rsvpSettings: RsvpSettings;
};

export type GuestSummary = {
  goingNames: string[];
  going: number;
  maybe: number;
  adults: number;
  kids: number;
};

export type MyRsvp = {
  name: string;
  status: "going" | "maybe" | "no";
  adults: number;
  kids: number;
  email: string;
  phone: string;
  note: string;
} | null;

export function toView(row: EventRow): EventView {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    badge: row.badge,
    tagline: row.tagline,
    subtitle: row.subtitle,
    arrivalNote: row.arrivalNote,
    status: row.status,
    startsAt: row.startsAt?.toISOString() ?? null,
    endsAt: row.endsAt?.toISOString() ?? null,
    timezone: row.timezone,
    hostedBy: row.hostedBy,
    locationName: row.locationName,
    locationAddress: row.locationAddress,
    capacity: row.capacity,
    theme: row.theme,
    effect: row.effect,
    titleFont: row.titleFont,
    coverImageId: row.coverImageId,
    shareImageId: row.shareImageId,
    coverEmoji: row.coverEmoji,
    sections: row.sections,
    rsvpSettings: row.rsvpSettings,
  };
}

/** Parties without an end time are considered over this many hours after they start. */
export const DEFAULT_DURATION_HOURS = 4;

export function effectiveEnd(e: Pick<EventView, "startsAt" | "endsAt">): Date | null {
  if (e.endsAt) return new Date(e.endsAt);
  if (e.startsAt) return new Date(new Date(e.startsAt).getTime() + DEFAULT_DURATION_HOURS * 3600_000);
  return null;
}

export function hasEnded(e: Pick<EventView, "startsAt" | "endsAt">, now = new Date()) {
  const end = effectiveEnd(e);
  return end !== null && end < now;
}

export function rsvpClosedReason(e: EventView, now = new Date()): string | null {
  if (e.status === "inactive" || hasEnded(e, now)) return "This party has wrapped up. Thank you for celebrating with us!";
  if (e.rsvpSettings.deadline && new Date(e.rsvpSettings.deadline) < now) return "RSVPs are closed.";
  return null;
}

export function mapsUrl(e: Pick<EventView, "locationName" | "locationAddress">) {
  const q = [e.locationName, e.locationAddress].filter(Boolean).join(", ");
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null;
}

export const rsvpCookieName = (eventId: string) => `rsvp_${eventId}`;
