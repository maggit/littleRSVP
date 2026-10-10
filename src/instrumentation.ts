export async function register() {
  // Apply pending database migrations once when the Node server boots.
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.DATABASE_URL && process.env.SKIP_MIGRATIONS !== "1") {
    const { runMigrations } = await import("./db/migrate");
    await runMigrations();
  }
}
