import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// drizzle-kit doesn't read Next's env files, so load them for local commands.
for (const file of [".env.local", ".env"]) {
  if (!process.env.DATABASE_URL && existsSync(file)) process.loadEnvFile(file);
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
