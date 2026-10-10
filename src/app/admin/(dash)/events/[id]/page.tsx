import { notFound } from "next/navigation";
import { EventEditor } from "@/components/admin/EventEditor";
import { requireAdmin } from "@/lib/admin";
import { toView } from "@/lib/event";
import { getI18n } from "@/lib/i18n/server";
import { siteOrigin } from "@/lib/origin";
import { getEventById, guestSummary } from "@/lib/queries";

export default async function EditEventPage({ params }: PageProps<"/admin/events/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const row = await getEventById(id);
  if (!row) notFound();
  const origin = await siteOrigin();
  const { lang } = await getI18n();
  return <EventEditor key={id} id={id} event={toView(row)} summary={await guestSummary(id)} origin={origin} lang={lang} />;
}
