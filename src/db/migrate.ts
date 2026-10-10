import path from "node:path";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from ".";

export async function runMigrations() {
  const migrationsFolder = process.env.MIGRATIONS_DIR ?? path.join(process.cwd(), "drizzle");
  await migrate(db, { migrationsFolder });
  console.log("✓ database migrations applied");
}
