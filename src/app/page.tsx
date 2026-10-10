import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { getSiteSettings } from "@/lib/settings";
import s from "./home.module.css";

// The name and footer come from /admin/settings, so render on each request (also keeps the
// database out of `next build`).
export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const { landingLine1, landingLine2, landingDescription } = await getSiteSettings();
  const name = [landingLine1, landingLine2].filter(Boolean).join(" ");
  return { title: { absolute: `${name} ✳` }, description: landingDescription || name };
}

export const viewport: Viewport = { themeColor: "#a9b4ed" };

export default async function Home() {
  await connection();
  const { landingLine1, landingLine2, landingFooter } = await getSiteSettings();
  return (
    <div className={s.page}>
      <main className={s.main}>
        <h1 className={s.name}>
          <span>{landingLine1}</span>
          {landingLine2 && <span>{landingLine2}</span>}
        </h1>
        <div className={s.character} role="img" aria-label="A friendly little cream cloud with rosy cheeks and a smile">
          <svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <g className={s.face}>
              <path
                d="M72 192C34 190 20 160 32 134c10-22 31-29 53-25C77 70 106 43 141 48c19 2 33 12 42 26 16-39 65-48 94-20 13 12 18 26 18 39 32-8 66 14 68 47 2 26-15 46-38 51-5 37-36 64-74 64H139c-37 0-65-23-67-63Z"
                fill="var(--cream)"
                stroke="var(--ink)"
                strokeWidth="6"
                strokeLinejoin="round"
              />
              <ellipse cx="125" cy="167" rx="23" ry="13" fill="var(--pink)" opacity=".7" />
              <ellipse cx="279" cy="167" rx="23" ry="13" fill="var(--pink)" opacity=".7" />
              <g className={s.eyes} fill="var(--ink)">
                <ellipse cx="159" cy="151" rx="6" ry="10" />
                <ellipse cx="242" cy="151" rx="6" ry="10" />
              </g>
              <path d="M185 171q15 18 31 0" fill="none" stroke="var(--ink)" strokeWidth="5" strokeLinecap="round" />
            </g>
            <path d="m65 38 5 12 12 5-12 5-5 12-5-12-12-5 12-5Z" fill="#f7ca58" />
            <path d="m335 42 4 10 10 4-10 4-4 10-4-10-10-4 10-4Z" fill="var(--pink)" />
            <circle cx="38" cy="209" r="6" fill="var(--blue)" />
            <circle cx="358" cy="215" r="7" fill="#f7ca58" />
          </svg>
        </div>
      </main>

      <footer className={s.bottom}>
        {landingFooter && <div className={s.location}>{landingFooter}</div>}
      </footer>
    </div>
  );
}
