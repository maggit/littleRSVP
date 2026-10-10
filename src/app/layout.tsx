import type { Metadata, Viewport } from "next";
import { getI18n } from "@/lib/i18n/server";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";

// The language comes from /admin/settings, so every page renders per request (getI18n waits for
// one, which also keeps the database out of `next build`).
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: { default: "Little RSVP", template: "%s · Little RSVP" },
    description: t.meta.description,
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf5ef" },
    { media: "(prefers-color-scheme: dark)", color: "#2a1a26" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { lang } = await getI18n();
  return (
    <html lang={lang} className={`${fontVariables} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
