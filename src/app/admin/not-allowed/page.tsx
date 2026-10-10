import type { Metadata, Viewport } from "next";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.notAllowed, robots: { index: false } };
}

export const viewport: Viewport = { themeColor: "#a9b4ed" };

// Where Auth.js sends anyone who isn't on the admin allowlist. No session is created for them.
export default async function NotAllowed() {
  const { t } = await getI18n();
  return (
    <main className="grid min-h-dvh place-items-center bg-sky-page px-4">
      <div className="w-full max-w-sm rounded-[2rem] border border-line bg-white/70 p-8 text-center shadow-[0_30px_80px_-50px_rgb(0_0_0/0.5)] backdrop-blur-md">
        <p className="font-display text-4xl [font-variation-settings:'SOFT'_100,'WONK'_1]">{t.notAllowed.title}</p>
        <p className="mt-3 text-ink-soft">{t.notAllowed.body}</p>
      </div>
    </main>
  );
}
