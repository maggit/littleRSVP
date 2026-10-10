import "server-only";
import { and, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { images } from "@/db/schema";

const unused = sql`not exists (select 1 from events e where e.cover_image_id = ${images.id} or e.share_image_id = ${images.id})`;

/** Delete these images unless another event still uses them (duplicated events share images). */
export async function pruneImages(ids: (string | null | undefined)[]) {
  const list = ids.filter((id): id is string => !!id);
  if (!list.length) return;
  await db.delete(images).where(and(inArray(images.id, list), unused));
}

/** Delete uploads nobody saved into an event. The grace period spares images still being edited. */
export async function sweepStaleImages() {
  await db.delete(images).where(and(lt(images.createdAt, sql`now() - interval '1 day'`), unused));
}
