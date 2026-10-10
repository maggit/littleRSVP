import { siteOrigin } from "@/lib/origin";
import { getEventBySlug } from "@/lib/queries";

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/[\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

export async function GET(_req: Request, { params }: RouteContext<"/e/[slug]/calendar.ics">) {
  const { slug } = await params;
  const e = await getEventBySlug(slug);
  if (!e?.startsAt) return new Response("Not found", { status: 404 });
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
    `DESCRIPTION:${esc(url)}`,
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
