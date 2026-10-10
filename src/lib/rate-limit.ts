import "server-only";
import { headers } from "next/headers";

// In-memory sliding window. Enough for the single container this app runs as; it resets on
// restart, which is fine for slowing down spam.
const hits = new Map<string, number[]>();

/** Records a hit for `key` and returns false once more than `limit` happened within `windowMs`. */
export function allow(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 10_000) {
    for (const [k, ts] of hits) if (ts.every((t) => now - t >= windowMs)) hits.delete(k);
  }
  return true;
}

/**
 * Best-effort client IP. Uses the last X-Forwarded-For hop: that's the one added by the reverse
 * proxy in front of the app (Traefik, Heroku, Railway…), so clients can't spoof it by sending
 * their own header.
 */
export async function clientIp() {
  const h = await headers();
  const xff = h.get("x-forwarded-for")?.split(",").map((s) => s.trim()).filter(Boolean);
  return xff?.at(-1) ?? h.get("x-real-ip") ?? "unknown";
}
