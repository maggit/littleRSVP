import { auth, isAdminEmail } from "@/auth";
import { db } from "@/db";
import { images } from "@/db/schema";
import { getI18n } from "@/lib/i18n/server";
import { toCoverImage, toShareImage } from "@/lib/share-image";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: Request) {
  const session = await auth();
  const { t } = await getI18n();
  if (!isAdminEmail(session?.user?.email)) return Response.json({ error: t.errors.unauthorized }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: t.errors.noFile }, { status: 400 });
  if (!TYPES.includes(file.type)) return Response.json({ error: t.errors.imageType }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ error: t.errors.imageSize }, { status: 400 });

  // Always re-encode, so what's stored and served is an image we produced, without metadata.
  let contentType: string;
  let data: Buffer;
  try {
    const input = Buffer.from(await file.arrayBuffer());
    if (form.get("kind") === "share") {
      data = await toShareImage(input);
      contentType = "image/jpeg";
    } else {
      data = await toCoverImage(input);
      contentType = "image/webp";
    }
  } catch {
    return Response.json({ error: t.errors.imageUnreadable }, { status: 400 });
  }

  const [row] = await db.insert(images).values({ contentType, data }).returning({ id: images.id });
  return Response.json({ id: row.id });
}
