import { nanoid } from "nanoid";
import { z } from "zod";
import type { Dict } from "./i18n";

// Names and hints for each type are in the dictionaries (`sectionTypes`).
export const SECTION_TYPES = {
  details: { emoji: "📍" },
  text: { emoji: "✏️" },
  callout: { emoji: "💡" },
  schedule: { emoji: "⏰" },
  links: { emoji: "🔗" },
  faq: { emoji: "❓" },
  guests: { emoji: "👯" },
} as const;

export type SectionType = keyof typeof SECTION_TYPES;

const base = { id: z.string().min(1).max(40), enabled: z.boolean() };
const str = (max: number) => z.string().max(max).default("");

export const sectionSchema = z.discriminatedUnion("type", [
  z.object({ ...base, type: z.literal("details") }),
  z.object({ ...base, type: z.literal("text"), title: str(120), body: str(5000) }),
  z.object({ ...base, type: z.literal("callout"), emoji: str(16), title: str(120), body: str(2000) }),
  z.object({
    ...base,
    type: z.literal("schedule"),
    title: str(120),
    items: z.array(z.object({ time: str(40), label: str(200) })).max(40),
  }),
  z.object({
    ...base,
    type: z.literal("links"),
    title: str(120),
    items: z.array(z.object({ label: str(120), url: str(1000) })).max(20),
  }),
  z.object({
    ...base,
    type: z.literal("faq"),
    title: str(120),
    items: z.array(z.object({ q: str(300), a: str(2000) })).max(30),
  }),
  z.object({ ...base, type: z.literal("guests"), title: str(120) }),
]);

export type Section = z.infer<typeof sectionSchema>;

export const rsvpSettingsSchema = z.object({
  askCounts: z.boolean(),
  askContact: z.boolean(),
  contactRequired: z.boolean(),
  askNote: z.boolean(),
  notePrompt: z.string().max(200),
  deadline: z.string().max(40).nullable(),
  labels: z.object({
    going: z.object({ emoji: z.string().max(16), text: z.string().max(30) }),
    maybe: z.object({ emoji: z.string().max(16), text: z.string().max(30) }),
    no: z.object({ emoji: z.string().max(16), text: z.string().max(30) }),
  }),
});

export type RsvpSettings = z.infer<typeof rsvpSettingsSchema>;

/** Starting RSVP settings for a new party, with labels in the site language. */
export function defaultRsvpSettings(t: Dict): RsvpSettings {
  return {
    askCounts: true,
    askContact: true,
    contactRequired: false,
    askNote: true,
    notePrompt: t.defaults.notePrompt,
    deadline: null,
    labels: {
      going: { emoji: "🥳", text: t.defaults.labels.going },
      maybe: { emoji: "🤔", text: t.defaults.labels.maybe },
      no: { emoji: "😢", text: t.defaults.labels.no },
    },
  };
}

/** A new section, with starting copy in the site language. */
export function newSection(type: SectionType, t: Dict): Section {
  const id = nanoid(10);
  switch (type) {
    case "details":
      return { id, type, enabled: true };
    case "text":
      return { id, type, enabled: true, title: "", body: "" };
    case "callout":
      return { id, type, enabled: true, emoji: "👗", title: t.defaults.callout, body: "" };
    case "schedule":
      return { id, type, enabled: true, title: t.defaults.schedule, items: [{ time: "", label: "" }] };
    case "links":
      return { id, type, enabled: true, title: t.defaults.links, items: [{ label: "", url: "" }] };
    case "faq":
      return { id, type, enabled: true, title: t.defaults.faq, items: [{ q: "", a: "" }] };
    case "guests":
      return { id, type, enabled: true, title: t.defaults.guests };
  }
}

export function defaultSections(t: Dict): Section[] {
  return [
    newSection("details", t),
    { ...newSection("schedule", t), enabled: false },
    newSection("guests", t),
  ];
}
