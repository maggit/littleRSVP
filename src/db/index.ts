import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pg?: ReturnType<typeof postgres> };

// postgres.js connects lazily, so this is safe to import at build time.
const client = (globalForDb.pg ??= postgres(process.env.DATABASE_URL ?? "postgres://localhost/unset", {
  max: 10,
  // Hosted Postgres that requires TLS but hands out URLs without `sslmode` (e.g. Heroku).
  ...(process.env.DATABASE_SSL === "require" && { ssl: "require" as const }),
}));

export const db = drizzle({ client, schema });
