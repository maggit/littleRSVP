import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { logout } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Little RSVP" }, robots: { index: false } };
export const viewport: Viewport = { themeColor: "#a9b4ed" };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await requireAdmin();
  return (
    <div className="min-h-dvh bg-sky-page">
      <header className="sticky top-0 z-30 border-b border-line bg-sky-page/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/admin" className="font-display text-xl font-medium whitespace-nowrap [font-variation-settings:'SOFT'_100,'WONK'_1]">
            Little RSVP
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/admin/settings" className="rounded-full px-3 py-1.5 font-semibold whitespace-nowrap text-ink-soft hover:bg-paper-2 hover:text-ink">Settings</Link>
            <span className="hidden truncate text-ink-soft sm:inline">{session.user?.email}</span>
            <form action={logout}>
              <button className="rounded-full px-3 py-1.5 font-semibold whitespace-nowrap text-ink-soft hover:bg-paper-2 hover:text-ink">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
