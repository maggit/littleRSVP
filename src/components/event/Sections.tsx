import type { ReactNode } from "react";
import { mapsUrl, type EventView, type GuestSummary } from "@/lib/event";
import type { Section } from "@/lib/sections";
import { formatEventDate } from "@/lib/time";
import { CalendarIcon, CrownIcon, PeopleIcon, PinIcon } from "./Icons";

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[1.75rem] border border-(--ev-line) bg-(--ev-card) p-6 backdrop-blur-md @xl:p-7 ${className}`}>
      {children}
    </section>
  );
}

function Heading({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <h2 className="ev-heading mb-3 text-2xl leading-tight">{children}</h2>;
}

export function Body({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-[1.05rem] leading-relaxed text-(--ev-ink)/90">
      {text
        .split(/\n\s*\n/)
        .filter((p) => p.trim())
        .map((p, i) => (
          <p key={i} className="whitespace-pre-line">{p.trim()}</p>
        ))}
    </div>
  );
}

function safeUrl(url: string) {
  try {
    const u = new URL(url.includes("://") ? url : `https://${url}`);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

function DetailRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex gap-4 py-4 first:pt-0 last:pb-0">
      <span className="mt-0.5 shrink-0 text-(--ev-accent)">{icon}</span>
      <div className="min-w-0">{children}</div>
    </li>
  );
}

function googleCalendarUrl(event: EventView) {
  if (!event.startsAt) return null;
  const fmt = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = event.endsAt ?? new Date(new Date(event.startsAt).getTime() + 3 * 3600_000).toISOString();
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${fmt(event.startsAt)}/${fmt(end)}`,
    location: [event.locationName, event.locationAddress].filter(Boolean).join(", "),
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

function Details({ event, summary }: { event: EventView; summary: GuestSummary }) {
  const maps = mapsUrl(event);
  const spotsTaken = summary.adults + summary.kids;
  const date = formatEventDate(event.startsAt, event.endsAt, event.timezone);
  const gcal = googleCalendarUrl(event);
  const rows: ReactNode[] = [];
  rows.push(
    <DetailRow key="date" icon={<CalendarIcon />}>
      {date ? (
        <>
          <p className="ev-heading text-xl">{date.day}</p>
          <p className="text-(--ev-muted)">{date.times}</p>
          <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <a href={`/e/${event.slug}/calendar.ics`} className="ev-link">Add to calendar</a>
            {gcal && <a href={gcal} target="_blank" rel="noreferrer" className="ev-link">Google Calendar</a>}
          </p>
        </>
      ) : (
        <p className="ev-heading text-xl">Date coming soon</p>
      )}
    </DetailRow>,
  );
  if (event.locationName || event.locationAddress) {
    rows.push(
      <DetailRow key="loc" icon={<PinIcon />}>
        <p className="ev-heading text-xl">{event.locationName || event.locationAddress}</p>
        {event.locationName && event.locationAddress && <p className="whitespace-pre-line text-(--ev-muted)">{event.locationAddress}</p>}
        {maps && (
          <a href={maps} target="_blank" rel="noreferrer" className="ev-link mt-1 inline-block text-sm">
            Open in Maps
          </a>
        )}
      </DetailRow>,
    );
  }
  if (event.hostedBy) {
    rows.push(
      <DetailRow key="host" icon={<CrownIcon />}>
        <p className="ev-heading text-xl">Hosted by {event.hostedBy}</p>
      </DetailRow>,
    );
  }
  if (event.capacity) {
    const left = Math.max(0, event.capacity - spotsTaken);
    rows.push(
      <DetailRow key="cap" icon={<PeopleIcon />}>
        <p className="font-semibold">{left === 0 ? "All spots are taken" : `${left} of ${event.capacity} spots left`}</p>
      </DetailRow>,
    );
  }
  return (
    <Panel>
      <ul className="divide-y divide-(--ev-line)">{rows}</ul>
      {event.arrivalNote && (
        <p className="mt-4 border-t border-(--ev-line) pt-4 text-sm leading-relaxed whitespace-pre-line text-(--ev-muted)">{event.arrivalNote}</p>
      )}
    </Panel>
  );
}

function Guests({ title, summary }: { title: string; summary: GuestSummary }) {
  const counts = [
    summary.going && `${summary.going} going`,
    summary.maybe && `${summary.maybe} maybe`,
  ].filter(Boolean);
  return (
    <Panel>
      <Heading>{title}</Heading>
      {summary.going === 0 ? (
        <p className="text-(--ev-muted)">Be the first to RSVP!</p>
      ) : (
        <>
          <p className="mb-4 text-sm text-(--ev-muted)">{counts.join(" · ")}</p>
          <ul className="flex flex-wrap gap-2">
            {summary.goingNames.map((name, i) => (
              <li key={i} className="flex items-center gap-2 rounded-full border border-(--ev-line) py-1 pl-1 pr-3">
                <span className="grid size-7 place-items-center rounded-full bg-(--ev-accent) text-xs font-bold text-(--ev-accent-ink)">
                  {name.charAt(0).toUpperCase()}
                </span>
                <span className="text-sm">{name}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}

export function SectionView({ section, event, summary }: { section: Section; event: EventView; summary: GuestSummary }) {
  switch (section.type) {
    case "details":
      return <Details event={event} summary={summary} />;
    case "text":
      if (!section.title && !section.body.trim()) return null;
      return (
        <Panel>
          <Heading>{section.title}</Heading>
          <Body text={section.body} />
        </Panel>
      );
    case "callout":
      if (!section.title && !section.body.trim()) return null;
      return (
        <Panel className="flex gap-4">
          {section.emoji && <span className="text-3xl leading-none">{section.emoji}</span>}
          <div className="min-w-0">
            {section.title && <h2 className="ev-heading mb-1 text-xl">{section.title}</h2>}
            <Body text={section.body} />
          </div>
        </Panel>
      );
    case "schedule": {
      const items = section.items.filter((i) => i.time || i.label);
      if (!items.length) return null;
      return (
        <Panel>
          <Heading>{section.title}</Heading>
          <ol className="space-y-3">
            {items.map((item, i) => (
              <li key={i} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3">
                <span className="font-semibold tabular-nums text-(--ev-accent)">{item.time}</span>
                <span>{item.label}</span>
              </li>
            ))}
          </ol>
        </Panel>
      );
    }
    case "links": {
      const items = section.items.map((i) => ({ ...i, href: safeUrl(i.url) })).filter((i) => i.href);
      if (!items.length) return null;
      return (
        <Panel>
          <Heading>{section.title}</Heading>
          <ul className="flex flex-wrap gap-2">
            {items.map((item, i) => (
              <li key={i}>
                <a
                  href={item.href!}
                  target="_blank"
                  rel="noreferrer"
                  className="ev-chip inline-flex max-w-full items-center gap-2 truncate rounded-full border border-(--ev-line) px-4 py-2 font-semibold"
                >
                  {item.label || new URL(item.href!).hostname}
                  <span aria-hidden>↗</span>
                </a>
              </li>
            ))}
          </ul>
        </Panel>
      );
    }
    case "faq": {
      const items = section.items.filter((i) => i.q);
      if (!items.length) return null;
      return (
        <Panel>
          <Heading>{section.title}</Heading>
          <div className="divide-y divide-(--ev-line)">
            {items.map((item, i) => (
              <details key={i} className="group py-3 first:pt-0 last:pb-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {item.q}
                  <span aria-hidden className="text-(--ev-accent) transition-transform group-open:rotate-45">+</span>
                </summary>
                <div className="pt-2 text-(--ev-muted)"><Body text={item.a} /></div>
              </details>
            ))}
          </div>
        </Panel>
      );
    }
    case "guests":
      return <Guests title={section.title} summary={summary} />;
  }
}
