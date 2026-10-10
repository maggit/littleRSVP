import { desc, sql } from "drizzle-orm";
import Link from "next/link";
import { createEvent, setEventStatus } from "@/app/admin/actions";
import { db } from "@/db";
import { events, rsvps } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { closeEndedEvents } from "@/lib/queries";
import { getTheme } from "@/lib/themes";
import { formatEventDate } from "@/lib/time";

export default async function AdminHome() {
  await requireAdmin();
  await closeEndedEvents();
  const rows = await db
    .select({
      id: events.id,
      slug: events.slug,
      title: events.title,
      status: events.status,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      timezone: events.timezone,
      theme: events.theme,
      coverEmoji: events.coverEmoji,
      coverImageId: events.coverImageId,
      going: sql<number>`coalesce(sum(case when ${rsvps.status} = 'going' then ${rsvps.adults} + ${rsvps.kids} end), 0)::int`,
      responses: sql<number>`count(${rsvps.id})::int`,
    })
    .from(events)
    .leftJoin(rsvps, sql`${rsvps.eventId} = ${events.id}`)
    .groupBy(events.id)
    .orderBy(sql`${events.status} = 'inactive'`, desc(events.startsAt), desc(events.createdAt));

  const active = rows.filter((r) => r.status === "active");
  const past = rows.filter((r) => r.status === "inactive");

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-medium tracking-tight [font-variation-settings:'SOFT'_100,'WONK'_1] sm:text-5xl">Parties</h1>
          <p className="mt-1 text-ink-soft">Create an invitation, share the link, watch the RSVPs roll in.</p>
        </div>
        <form action={createEvent}>
          <button className="rounded-full bg-rose-deep px-5 py-2.5 font-semibold whitespace-nowrap text-white shadow-sm transition hover:bg-rose active:translate-y-px">
            + New party
          </button>
        </form>
      </div>

      <EventList title="Active" rows={active} empty="No active parties. Start one!" />
      {past.length > 0 && <EventList title="Past & inactive" rows={past} />}
    </main>
  );
}

type Row = {
  id: string;
  slug: string;
  title: string;
  status: "active" | "inactive";
  startsAt: Date | null;
  endsAt: Date | null;
  timezone: string;
  theme: string;
  coverEmoji: string;
  coverImageId: string | null;
  going: number;
  responses: number;
};

function EventList({ title, rows, empty }: { title: string; rows: Row[]; empty?: string }) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-ink-soft uppercase">{title}</h2>
      {rows.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line px-6 py-10 text-center text-ink-soft">{empty}</p>
      ) : (
        <ul className="grid gap-3">
          {rows.map((r) => {
            const date = formatEventDate(r.startsAt?.toISOString() ?? null, r.endsAt?.toISOString() ?? null, r.timezone);
            const theme = getTheme(r.theme);
            return (
              <li key={r.id} className="flex flex-wrap items-center gap-4 rounded-3xl border border-line bg-white/60 p-3 pr-4 sm:flex-nowrap">
                <Link href={`/admin/events/${r.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                  <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl text-3xl" style={{ background: theme.cover }}>
                    {r.coverImageId ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/api/images/${r.coverImageId}`} alt="" className="size-full object-cover" />
                    ) : (
                      r.coverEmoji
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-lg font-semibold">{r.title}</span>
                    <span className="block truncate text-sm text-ink-soft">
                      {date ? `${date.day} · ${date.times}` : "No date yet"} · {r.going} going · {r.responses} response{r.responses === 1 ? "" : "s"}
                    </span>
                  </span>
                </Link>
                <div className="flex shrink-0 items-center gap-1 text-sm font-semibold">
                  <Link href={`/admin/events/${r.id}/rsvps`} className="rounded-full px-3 py-1.5 hover:bg-paper-2">RSVPs</Link>
                  <a href={`/e/${r.slug}`} target="_blank" className="rounded-full px-3 py-1.5 hover:bg-paper-2">View</a>
                  <form action={setEventStatus.bind(null, r.id, r.status === "active" ? "inactive" : "active")}>
                    <button className="rounded-full px-3 py-1.5 whitespace-nowrap text-ink-soft hover:bg-paper-2 hover:text-ink">
                      {r.status === "active" ? "Mark inactive" : "Reactivate"}
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
