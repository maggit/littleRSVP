import { Fragment, type ReactNode } from "react";
import { type EventView, type GuestSummary } from "@/lib/event";
import { getTheme, themeStyle } from "@/lib/themes";
import { formatEventDate } from "@/lib/time";
import { getTitleFont } from "@/lib/title-fonts";
import { Cover } from "./Cover";
import { Body, Panel, SectionView } from "./Sections";
import { Sprinkles } from "./Sprinkles";

/** "Theo turns 3!" → ["Theo", "turns 3!"]; the second line is drawn in the accent color. */
function splitTitle(title: string): [string, string] {
  const [first, ...rest] = title.trim().split(/\s+/);
  return [first ?? "", rest.join(" ")];
}

export function EventPage({
  event,
  summary,
  rsvp,
  banner,
  coverSrc,
  contained = false,
}: {
  event: EventView;
  summary: GuestSummary;
  /** The RSVP card (a client component on the live page, a disabled copy in the editor preview). */
  rsvp: ReactNode;
  banner?: ReactNode;
  coverSrc?: string | null;
  /** Render inside a scrolling preview pane rather than the full viewport. */
  contained?: boolean;
}) {
  const theme = getTheme(event.theme);
  const font = getTitleFont(event.titleFont);
  const date = formatEventDate(event.startsAt, event.endsAt, event.timezone);
  const [line1, line2] = splitTitle(event.title || "Untitled party");
  const sections = event.sections.filter((s) => s.enabled);

  return (
    <div
      className={`ev-root @container relative isolate text-(--ev-ink) ${contained ? "min-h-full" : "min-h-dvh"}`}
      style={{ ...themeStyle(theme), "--ev-title-font": font.family, "--ev-title-settings": font.settings, "--ev-title-weight": font.weight, "--ev-title-tracking": font.tracking } as React.CSSProperties}
    >
      <Sprinkles effect={event.effect} colors={theme.sprinkles} contained={contained} />
      {banner}
      <main className={`relative mx-auto w-full max-w-[690px] px-4 pb-24 text-center @xl:px-6 ${contained ? "pt-8" : "pt-10 @3xl:pt-14"}`}>
        <header>
          <p className="text-xs font-extrabold tracking-[0.24em] text-(--ev-muted) uppercase">
            You&rsquo;re invited{date && ` · ${date.long}`}
          </p>
          {event.badge && (
            <p className="mt-6 inline-block -rotate-3 rounded-full bg-(--ev-ink) px-4 py-2 text-xs font-extrabold tracking-[0.13em] text-(--ev-on-ink) uppercase">
              {event.badge}
            </p>
          )}
          <h1 className="ev-title mt-6 text-[clamp(4rem,15cqi,7.4rem)] leading-[0.87]">
            {line1}
            {line2 && <span className="ev-title-accent block">{line2}</span>}
          </h1>
          {event.tagline && (
            <p className="ev-tagline mt-4 text-[clamp(1.4rem,5cqi,2.1rem)] leading-tight">{event.tagline}</p>
          )}
        </header>

        <div className="mt-6">
          <Cover event={event} imageSrc={coverSrc} />
        </div>

        {/* RSVP sits right after the details panel (or first, if there isn't one). */}
        <div className="mt-7 space-y-4 text-left">
          {event.subtitle && (
            <Panel>
              <Body text={event.subtitle} />
            </Panel>
          )}
          {!sections.some((s) => s.type === "details") && rsvp}
          {sections.map((s) => (
            <Fragment key={s.id}>
              <SectionView section={s} event={event} summary={summary} />
              {s.type === "details" && rsvp}
            </Fragment>
          ))}
        </div>
      </main>
    </div>
  );
}
