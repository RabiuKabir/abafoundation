import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";
import { sslFor } from "@/db/ssl";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set.");

/**
 * Supabase, from a serverless runtime, must go through the Supavisor pooler
 * (the `...pooler.supabase.com:6543` transaction-mode URL). Transaction mode
 * cannot hold server-side prepared statements across a pooled connection, so
 * `prepare` must be off. `DIRECT_URL` (port 5432) is for migrations only —
 * see drizzle.config.ts.
 */
const globalForDb = globalThis as unknown as {
  client?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.client ??
  postgres(url, {
    prepare: false,
    max: 5,
    ssl: sslFor(url),
  });

if (process.env.NODE_ENV !== "production") globalForDb.client = client;

export const db = drizzle(client, { schema });
export { schema };
