export async function register() {
  if (process.env.NODE_ENV === "production" && !process.env.AUTH_URL) {
    console.warn("⚠ AUTH_URL is not set. Set it to your public URL so links and sign-in use a fixed origin instead of request headers.");
  }
  // Apply pending database migrations once when the Node server boots.
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.DATABASE_URL && process.env.SKIP_MIGRATIONS !== "1") {
    const { runMigrations } = await import("./db/migrate");
    await runMigrations();
  }
}
