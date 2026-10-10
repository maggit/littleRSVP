import {
  check,
  customType,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { LANGS } from "@/lib/i18n";
import type { RsvpSettings, Section } from "@/lib/sections";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  badge: text("badge").notNull().default(""),
  tagline: text("tagline").notNull().default(""),
  subtitle: text("subtitle").notNull().default(""),
  arrivalNote: text("arrival_note").notNull().default(""),
  status: text("status", { enum: ["active", "inactive"] }).notNull().default("active"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  timezone: text("timezone").notNull().default("America/New_York"),
  hostedBy: text("hosted_by").notNull().default(""),
  locationName: text("location_name").notNull().default(""),
  locationAddress: text("location_address").notNull().default(""),
  capacity: integer("capacity"),
  theme: text("theme").notNull().default("blush"),
  effect: text("effect").notNull().default("confetti"),
  titleFont: text("title_font").notNull().default("classic"),
  coverImageId: uuid("cover_image_id"),
  /** 1200x630 JPEG used for link previews (WhatsApp, iMessage…). None by default. */
  shareImageId: uuid("share_image_id"),
  coverEmoji: text("cover_emoji").notNull().default("🎂"),
  sections: jsonb("sections").$type<Section[]>().notNull().default([]),
  rsvpSettings: jsonb("rsvp_settings").$type<RsvpSettings>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rsvps = pgTable(
  "rsvps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    status: text("status", { enum: ["going", "maybe", "no"] }).notNull(),
    adults: integer("adults").notNull().default(1),
    kids: integer("kids").notNull().default(0),
    email: text("email").notNull().default(""),
    phone: text("phone").notNull().default(""),
    note: text("note").notNull().default(""),
    editToken: text("edit_token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("rsvps_event_idx").on(t.eventId)],
);

export const images = pgTable("images", {
  id: uuid("id").primaryKey().defaultRandom(),
  contentType: text("content_type").notNull(),
  data: bytea("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Site-wide settings, edited at /admin/settings. Always a single row with id 1. */
export const siteSettings = pgTable(
  "site_settings",
  {
    id: integer("id").primaryKey().default(1),
    /** Landing page name, drawn on two lines (e.g. a child's first and last name). */
    landingLine1: text("landing_line1").notNull().default("Little"),
    landingLine2: text("landing_line2").notNull().default("RSVP"),
    /** Short description for search results and link previews of the landing page. */
    landingDescription: text("landing_description").notNull().default(""),
    /** Small caps text in the landing page's bottom corner. Hidden when empty. */
    landingFooter: text("landing_footer").notNull().default(""),
    /** Language of the whole site (public pages, admin, new-party defaults). */
    language: text("language", { enum: LANGS }).notNull().default("en"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("site_settings_single_row", sql`${t.id} = 1`),
    check("site_settings_language", sql`${t.language} in ('en', 'es')`),
  ],
);

export type EventRow = typeof events.$inferSelect;
export type RsvpRow = typeof rsvps.$inferSelect;
