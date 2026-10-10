import { nanoid } from "nanoid";
import { z } from "zod";

export const SECTION_TYPES = {
  details: { label: "Event details", emoji: "📍", hint: "Date, place, host and spots" },
  text: { label: "Text", emoji: "✏️", hint: "A heading and a few paragraphs" },
  callout: { label: "Callout", emoji: "💡", hint: "Dress code, parking, allergies…" },
  schedule: { label: "Schedule", emoji: "⏰", hint: "What happens when" },
  links: { label: "Links", emoji: "🔗", hint: "Registry, playlist, photos" },
  faq: { label: "Questions", emoji: "❓", hint: "Answers to the usual questions" },
  guests: { label: "Guest list", emoji: "👯", hint: "Who's coming" },
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

export const defaultRsvpSettings: RsvpSettings = {
  askCounts: true,
  askContact: true,
  contactRequired: false,
  askNote: true,
  notePrompt: "Allergies, or a note for the birthday girl?",
  deadline: null,
  labels: {
    going: { emoji: "🥳", text: "Going" },
    maybe: { emoji: "🤔", text: "Maybe" },
    no: { emoji: "😢", text: "Can't go" },
  },
};

export function newSection(type: SectionType): Section {
  const id = nanoid(10);
  switch (type) {
    case "details":
      return { id, type, enabled: true };
    case "text":
      return { id, type, enabled: true, title: "", body: "" };
    case "callout":
      return { id, type, enabled: true, emoji: "👗", title: "Dress code", body: "" };
    case "schedule":
      return { id, type, enabled: true, title: "Schedule", items: [{ time: "", label: "" }] };
    case "links":
      return { id, type, enabled: true, title: "Links", items: [{ label: "", url: "" }] };
    case "faq":
      return { id, type, enabled: true, title: "Good to know", items: [{ q: "", a: "" }] };
    case "guests":
      return { id, type, enabled: true, title: "Who's coming" };
  }
}

export function defaultSections(): Section[] {
  return [
    newSection("details"),
    { ...newSection("schedule"), enabled: false },
    newSection("guests"),
  ];
}
