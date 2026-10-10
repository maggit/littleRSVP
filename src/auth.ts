import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

export function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined) {
  return !!email && adminEmails().includes(email.toLowerCase());
}

export const NOT_ALLOWED_PATH = "/admin/not-allowed";

const providers: Provider[] = [Google];

// Local-only shortcut so the admin can be exercised without Google credentials.
// `next build` sets NODE_ENV=production, so this never ships.
export const devLoginEnabled = process.env.NODE_ENV === "development" && !!process.env.DEV_LOGIN_EMAIL;
if (devLoginEnabled) {
  providers.push(
    Credentials({
      id: "dev",
      name: "Dev login",
      credentials: {},
      // `next dev` listens on every interface, so refuse anyone not on this machine.
      authorize: (_credentials, request) =>
        ["localhost", "127.0.0.1", "[::1]"].includes(new URL(request.url).hostname)
          ? { id: "dev", email: process.env.DEV_LOGIN_EMAIL!, name: "Dev" }
          : null,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  trustHost: true,
  pages: { signIn: "/admin/login", error: "/admin/login" },
  callbacks: {
    // No adapter + JWT sessions: nothing is stored for anyone. Anyone off the
    // allowlist gets no session cookie and is sent to the not-allowed page.
    signIn({ user, account, profile }) {
      const allowed =
        account?.provider === "google"
          ? profile?.email_verified === true && isAdminEmail(profile.email)
          : devLoginEnabled && isAdminEmail(user.email);
      return allowed || NOT_ALLOWED_PATH;
    },
  },
});
