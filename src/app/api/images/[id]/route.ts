import { eq } from "drizzle-orm";
import { db } from "@/db";
import { images } from "@/db/schema";
import { getI18n } from "@/lib/i18n/server";

async function notFound() {
  const { t } = await getI18n();
  return new Response(t.errors.notFound, { status: 404 });
}

export async function GET(_req: Request, { params }: RouteContext<"/api/images/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return notFound();
  const [img] = await db.select().from(images).where(eq(images.id, id)).limit(1);
  if (!img) return notFound();
  return new Response(new Uint8Array(img.data), {
    headers: {
      "Content-Type": img.contentType,
      "X-Content-Type-Options": "nosniff",
      // Images are immutable: a new upload always gets a new id.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
