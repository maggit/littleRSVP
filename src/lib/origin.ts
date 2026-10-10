import "server-only";
import { headers } from "next/headers";

/** Public origin of the site, honoring AUTH_URL and reverse-proxy headers (Dokploy/Traefik). */
export async function siteOrigin() {
  if (process.env.AUTH_URL) return new URL(process.env.AUTH_URL).origin;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
