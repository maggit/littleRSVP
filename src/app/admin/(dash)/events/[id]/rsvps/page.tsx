import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteRsvp } from "@/app/admin/actions";
import { db } from "@/db";
import { rsvps } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { getEventById } from "@/lib/queries";

const ORDER = { going: 0, maybe: 1, no: 2 } as const;

export default async function RsvpsPage({ params }: PageProps<"/admin/events/[id]/rsvps">) {
  await requireAdmin();
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();
  const rows = (await db.select().from(rsvps).where(eq(rsvps.eventId, id)).orderBy(asc(rsvps.createdAt))).sort(
    (a, b) => ORDER[a.status] - ORDER[b.status],
  );
  const labels = event.rsvpSettings.labels;
  const going = rows.filter((r) => r.status === "going");
  const stats = [
    { label: "Going", value: going.length },
    { label: "Adults", value: going.reduce((n, r) => n + r.adults, 0) },
    { label: "Kids", value: going.reduce((n, r) => n + r.kids, 0) },
    { label: "Maybe", value: rows.filter((r) => r.status === "maybe").length },
    { label: "Can't go", value: rows.filter((r) => r.status === "no").length },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link href="/admin" className="text-sm font-semibold text-ink-soft hover:text-ink">← All parties</Link>
      <div className="mt-3 mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-4xl font-medium tracking-tight [font-variation-settings:'SOFT'_100,'WONK'_1]">{event.title}</h1>
          <p className="mt-1 text-ink-soft">Guest list</p>
        </div>
        <div className="flex gap-2 text-sm font-semibold">
          <Link href={`/admin/events/${id}`} className="rounded-full border border-line px-4 py-2 whitespace-nowrap hover:bg-paper-2">Edit page</Link>
          <a href={`/admin/events/${id}/rsvps.csv`} className="rounded-full border border-line px-4 py-2 whitespace-nowrap hover:bg-paper-2">Export CSV</a>
        </div>
      </div>

      <dl className="mb-8 grid grid-cols-3 gap-3 sm:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-3xl border border-line bg-white/60 px-4 py-3">
            <dt className="text-sm text-ink-soft">{s.label}</dt>
            <dd className="font-display text-3xl tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>

      {rows.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line px-6 py-12 text-center text-ink-soft">
          No RSVPs yet. Share <a className="font-semibold text-rose-deep underline" href={`/e/${event.slug}`}>/e/{event.slug}</a> with your guests.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-line bg-white/60">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-line text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-semibold">Guest</th>
                <th className="px-4 py-3 font-semibold">Answer</th>
                <th className="px-4 py-3 font-semibold">Party size</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Note</th>
                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="px-4 py-3 font-semibold">{r.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{labels[r.status].emoji} {labels[r.status].text}</td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                    {r.status === "no" ? "—" : `${r.adults} adult${r.adults === 1 ? "" : "s"}${r.kids ? `, ${r.kids} kid${r.kids === 1 ? "" : "s"}` : ""}`}
                  </td>
                  <td className="px-4 py-3 break-all">{r.email || <span className="text-ink-soft">—</span>}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{r.phone || <span className="text-ink-soft">—</span>}</td>
                  <td className="max-w-xs px-4 py-3 whitespace-pre-line">{r.note || <span className="text-ink-soft">—</span>}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={deleteRsvp.bind(null, id, r.id)}>
                      <button className="rounded-full px-2 py-1 text-xs font-semibold text-ink-soft hover:bg-rose/10 hover:text-rose-deep" aria-label={`Remove ${r.name}`}>
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
