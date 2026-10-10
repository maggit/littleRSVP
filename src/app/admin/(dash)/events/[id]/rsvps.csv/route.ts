import { asc, eq } from "drizzle-orm";
import { auth, isAdminEmail } from "@/auth";
import { db } from "@/db";
import { rsvps } from "@/db/schema";
import { getEventById } from "@/lib/queries";

// Quote every cell and neutralise spreadsheet formulas.
const cell = (v: string | number) => {
  const s = String(v);
  return `"${(/^[=+\-@\t\r]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};

export async function GET(_req: Request, { params }: RouteContext<"/admin/events/[id]/rsvps.csv">) {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) return new Response("Not found", { status: 404 });
  const rows = await db.select().from(rsvps).where(eq(rsvps.eventId, id)).orderBy(asc(rsvps.createdAt));
  const lines = [
    ["Name", "Answer", "Adults", "Kids", "Email", "Phone", "Note", "Responded"],
    ...rows.map((r) => [r.name, r.status, r.adults, r.kids, r.email, r.phone, r.note, r.updatedAt.toISOString()]),
  ].map((l) => l.map(cell).join(","));
  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}-rsvps.csv"`,
    },
  });
}
