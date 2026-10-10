import { getI18n } from "@/lib/i18n/server";
import { siteOrigin } from "@/lib/origin";
import { getEventBySlug } from "@/lib/queries";

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/[;,]/g, (c) => `\\${c}`).replace(/\r?\n|\r/g, "\\n");

export async function GET(_req: Request, { params }: RouteContext<"/e/[slug]/calendar.ics">) {
  const { slug } = await params;
  const { lang, t } = await getI18n();
  const e = await getEventBySlug(slug);
  if (!e?.startsAt) return new Response(t.errors.notFound, { status: 404 });
  const end = e.endsAt ?? new Date(e.startsAt.getTime() + 3 * 3600_000);
  const url = `${await siteOrigin()}/e/${e.slug}`;
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//littlersvp//events//EN",
    "BEGIN:VEVENT",
    `UID:${e.id}@littlersvp`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(e.startsAt)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(e.title)}`,
    `LOCATION:${esc([e.locationName, e.locationAddress].filter(Boolean).join(", "))}`,
    `URL:${url}`,
    // Only the description is our text; the title and place are whatever the host typed.
    `DESCRIPTION;LANGUAGE=${lang}:${esc(t.ics.description(url))}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${e.slug}.ics"`,
    },
  });
}
