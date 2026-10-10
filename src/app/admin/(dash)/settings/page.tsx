import type { Metadata } from "next";
import Link from "next/link";
import { saveSiteSettings } from "@/app/admin/settings-actions";
import { requireAdmin } from "@/lib/admin";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Settings" };

const inputCls =
  "w-full min-w-0 rounded-2xl border border-line bg-paper/60 px-3.5 py-2.5 text-[0.95rem] text-ink placeholder:text-ink-soft/60 focus-visible:border-rose-deep focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-rose-deep/40";

function TextField({ name, label, hint, defaultValue, placeholder, maxLength, required }: {
  name: string;
  label: string;
  hint?: string;
  defaultValue: string;
  placeholder?: string;
  maxLength: number;
  required?: boolean;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={name} className="mb-1.5 block text-sm font-semibold">{label}</label>
      <input id={name} name={name} defaultValue={defaultValue} placeholder={placeholder} maxLength={maxLength} required={required} className={inputCls} />
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

export default async function SettingsPage({ searchParams }: PageProps<"/admin/settings">) {
  await requireAdmin();
  const s = await getSiteSettings();
  const { saved, error } = await searchParams;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link href="/admin" className="text-sm font-semibold text-ink-soft hover:text-ink">‹ All parties</Link>
      <h1 className="mt-3 font-display text-4xl font-medium [font-variation-settings:'SOFT'_100,'WONK'_1]">Settings</h1>
      <p className="mt-2 text-ink-soft">Customize the landing page at the root of your site.</p>

      {saved && <p role="status" className="mt-6 rounded-2xl bg-butter px-4 py-3 text-sm font-semibold">Saved. The landing page is updated.</p>}
      {typeof error === "string" && <p role="alert" className="mt-6 rounded-2xl bg-rose/15 px-4 py-3 text-sm font-semibold text-rose-deep">{error}</p>}

      <form action={saveSiteSettings} className="mt-6 space-y-5 rounded-3xl border border-line bg-white/70 p-5 sm:p-6">
        <h2 className="font-display text-xl font-medium [font-variation-settings:'SOFT'_100]">Landing page</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="landingLine1" label="Name, first line" defaultValue={s.landingLine1} placeholder="Theo" maxLength={40} required />
          <TextField name="landingLine2" label="Name, second line" defaultValue={s.landingLine2} placeholder="Rivera" maxLength={40} hint="Optional. Leave empty for a single line." />
        </div>
        <TextField name="landingDescription" label="Description" defaultValue={s.landingDescription} placeholder="Theo's parties and celebrations" maxLength={200} hint="Shown in link previews and search results." />
        <TextField name="landingFooter" label="Footer" defaultValue={s.landingFooter} placeholder="Brooklyn, New York" maxLength={80} hint="Small text in the bottom corner. Optional." />
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button className="rounded-full bg-rose-deep px-5 py-2.5 font-semibold whitespace-nowrap text-white shadow-sm transition hover:bg-rose active:translate-y-px">Save settings</button>
          <a href="/" target="_blank" className="text-sm font-semibold text-ink-soft hover:text-ink">View landing page ↗</a>
        </div>
      </form>
    </main>
  );
}
