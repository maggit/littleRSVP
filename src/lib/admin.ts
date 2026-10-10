import "server-only";
import { redirect } from "next/navigation";
import { auth, isAdminEmail } from "@/auth";

/** Gate for admin pages and server actions. Re-checks the allowlist on every call. */
export async function requireAdmin() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) redirect("/admin/login");
  return session!;
}
