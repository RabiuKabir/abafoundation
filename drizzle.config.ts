import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env" });

/**
 * Migrations run over the DIRECT connection (Supabase port 5432), not the
 * transaction pooler — pooled connections can't reliably run DDL or advisory
 * locks. The app itself uses the pooled DATABASE_URL (see lib/db.ts).
 *
 * `generate` only reads db/schema.ts and needs no connection at all.
 */
const url = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
if (!url && !process.argv.includes("generate")) {
  throw new Error(
    "Set DIRECT_URL (preferred) or DATABASE_URL in .env before running migrations."
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dbCredentials: { url, ssl: "require" },
  verbose: true,
  strict: true,
});
