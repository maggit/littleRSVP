import { eq } from "drizzle-orm";
import { db } from "@/db";
import { images } from "@/db/schema";

export async function GET(_req: Request, { params }: RouteContext<"/api/images/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
  const [img] = await db.select().from(images).where(eq(images.id, id)).limit(1);
  if (!img) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(img.data), {
    headers: {
      "Content-Type": img.contentType,
      "X-Content-Type-Options": "nosniff",
      // Images are immutable: a new upload always gets a new id.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
