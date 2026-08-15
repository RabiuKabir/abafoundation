/**
 * Seed — creates exactly ONE Admin user, plus placeholder settings.
 *
 *   npm run db:seed
 *
 * Reads everything from .env (never from the repo):
 *   SEED_ADMIN_EMAIL, SEED_ADMIN_NAME, SEED_ADMIN_PASSWORD
 *
 * Idempotent: re-running promotes/reactivates the existing user instead of
 * creating a duplicate, leaves their password alone, and never overwrites
 * settings that have already been edited.
 */
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";

import { categories, settings, users } from "./schema";
import { sslFor } from "./ssl";

/** The foundation's real programme categories. Editable in Settings later. */
const CATEGORIES = [
  { name: "Scholarships", slug: "scholarships" },
  { name: "Empowerments", slug: "empowerments" },
  { name: "Community Service", slug: "community-service" },
  { name: "Helping the Needy", slug: "helping-the-needy" },
];

/**
 * DEMO VALUES — not a real account. Replace in Admin → Settings before the
 * Donate page goes live; these are what donors would transfer money to.
 */
const DEMO_SETTINGS = [
  {
    key: "org",
    value: {
      name: "ABA Foundation",
      email: "hello@abafoundation.org",
      phone: "+234 800 000 0000",
      address: "Demo address — update in Settings",
      currency: "NGN",
      currencySymbol: "₦",
      locale: "en-NG",
    },
  },
  {
    key: "bank_details",
    value: {
      demo: true, // remove once the real account is entered
      accountName: "ABA Foundation (DEMO — replace)",
      accountNumber: "0000000000",
      bankName: "Demo Bank Plc",
      currency: "NGN",
      referenceHint:
        "Quote your full name as the transfer narration, then tell us about it below.",
    },
  },
];

config({ path: ".env" });

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set in .env`);
  return value;
}

async function main() {
  // Seeding is a one-off script, so it uses the direct connection when one is
  // configured rather than the pooler.
  const url = process.env.DIRECT_URL || required("DATABASE_URL");
  const email = required("SEED_ADMIN_EMAIL").trim().toLowerCase();
  const password = required("SEED_ADMIN_PASSWORD");
  const name = process.env.SEED_ADMIN_NAME?.trim() || "Administrator";

  if (password.length < 8) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 8 characters.");
  }

  const connection = postgres(url, {
    prepare: false,
    max: 1,
    ssl: sslFor(url),
  });
  const db = drizzle(connection);

  const [existing] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    // BREAK GLASS. There is no password-reset email yet, so if the last Admin
    // forgets their password nothing in the app can rescue them. Setting
    // SEED_ADMIN_FORCE_PASSWORD=true overwrites the hash from the machine that
    // holds .env — deliberately opt-in, so a routine re-seed can't silently
    // reset a live account.
    const force = /^(1|true|yes)$/i.test(
      process.env.SEED_ADMIN_FORCE_PASSWORD ?? ""
    );

    if (force) {
      await db
        .update(users)
        .set({
          role: "admin",
          active: true,
          passwordHash: await bcrypt.hash(password, 12),
          mustChangePassword: true,
        })
        .where(eq(users.id, existing.id));
      console.log(`✔ ${email} — password RESET, role=admin, active=true.`);
      console.log("  They must choose a new password at next sign-in.");
    } else {
      await db
        .update(users)
        .set({ role: "admin", active: true })
        .where(eq(users.id, existing.id));
      console.log(`✔ ${email} already exists — ensured role=admin, active=true.`);
      console.log("  Password left unchanged.");
      console.log(
        "  Locked out? Re-run with SEED_ADMIN_FORCE_PASSWORD=true to reset it."
      );
    }
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await db.insert(users).values({ name, email, passwordHash, role: "admin" });
    console.log(`✔ Created Admin ${email}`);
    console.log("  Sign in with the temporary password and change it at once.");
  }

  for (const row of DEMO_SETTINGS) {
    const [present] = await db
      .select({ key: settings.key })
      .from(settings)
      .where(eq(settings.key, row.key))
      .limit(1);

    if (present) {
      console.log(`· settings["${row.key}"] already set — left untouched.`);
    } else {
      await db.insert(settings).values(row);
      console.log(`✔ Seeded settings["${row.key}"] with DEMO values.`);
    }
  }

  for (const category of CATEGORIES) {
    const [present] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, category.slug))
      .limit(1);
    if (present) {
      console.log(`· category "${category.name}" already exists.`);
    } else {
      await db.insert(categories).values(category);
      console.log(`✔ Seeded category "${category.name}".`);
    }
  }

  console.log("\n⚠ Bank details are placeholders. Replace them in");
  console.log("  Admin → Settings before the Donate page goes live.");

  await connection.end({ timeout: 5 });
}

main().catch((error) => {
  console.error("✖ Seed failed:", error);
  process.exit(1);
});
