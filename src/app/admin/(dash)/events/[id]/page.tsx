import { notFound } from "next/navigation";
import { EventEditor } from "@/components/admin/EventEditor";
import { requireAdmin } from "@/lib/admin";
import { toView } from "@/lib/event";
import { siteOrigin } from "@/lib/origin";
import { getEventById, guestSummary } from "@/lib/queries";

export default async function EditEventPage({ params }: PageProps<"/admin/events/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const row = await getEventById(id);
  if (!row) notFound();
  const origin = await siteOrigin();
  return <EventEditor key={id} id={id} event={toView(row)} summary={await guestSummary(id)} origin={origin} />;
}
