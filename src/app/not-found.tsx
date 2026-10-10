import type { Metadata } from "next";
import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.notFound.title };
}

// Shown for unknown URLs and whenever a page calls notFound() (a mistyped or deleted party link).
export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <main className="grid min-h-dvh place-items-center bg-sky-page px-4">
      <div className="w-full max-w-sm rounded-[2rem] border border-line bg-white/70 p-8 text-center shadow-[0_30px_80px_-50px_rgb(0_0_0/0.5)] backdrop-blur-md">
        <p aria-hidden className="text-5xl">🎈</p>
        <h1 className="mt-3 font-display text-4xl [font-variation-settings:'SOFT'_100,'WONK'_1]">{t.notFound.title}</h1>
        <p className="mt-3 text-ink-soft">{t.notFound.body}</p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-rose-deep px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-rose">
          {t.notFound.home}
        </Link>
      </div>
    </main>
  );
}
