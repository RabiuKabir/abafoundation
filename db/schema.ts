import {
  pgTable,
  pgEnum,
  varchar,
  text,
  boolean,
  timestamp,
  numeric,
  jsonb,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

/**
 * Foreign keys — enforced by Postgres, not just modelled in code.
 *
 * `restrict` guards anything a financial or attribution trail depends on:
 * you cannot delete a category, activity or staff member that donations,
 * media or content still point at. Staff are deactivated, never deleted
 * (see Phase 4), so `restrict` is the correct default for user links.
 *
 * `set null` is used only where the link is genuinely optional and losing it
 * costs nothing: an activity's cover image, media detached from its activity,
 * and the actor on an audit row (the log entry must outlive the account).
 */

const id = () =>
  varchar("id", { length: 24 })
    .primaryKey()
    .$defaultFn(() => createId());

/**
 * Postgres enums are named types, so each one is declared once here and
 * reused. `role` is shared by users and invites.
 */
const ROLES = ["admin", "editor"] as const;

export const roleEnum = pgEnum("role", ROLES);
export const activityStatusEnum = pgEnum("activity_status", [
  "draft",
  "in_review",
  "published",
  "archived",
]);
export const mediaTypeEnum = pgEnum("media_type", ["image", "video"]);
export const donationMethodEnum = pgEnum("donation_method", [
  "bank_transfer",
  "cash",
]);
export const donationStatusEnum = pgEnum("donation_status", [
  "pending",
  "confirmed",
  "rejected",
]);
export const contactStatusEnum = pgEnum("contact_status", ["new", "handled"]);

export const users = pgTable("users", {
  id: id(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: roleEnum("role").notNull().default("editor"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const invites = pgTable("invites", {
  id: id(),
  email: varchar("email", { length: 255 }).notNull(),
  role: roleEnum("role").notNull(),
  tokenHash: varchar("token_hash", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
});

export const categories = pgTable("categories", {
  id: id(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
});

export const activities = pgTable("activities", {
  id: id(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 280 }).notNull().unique(),
  summary: text("summary").notNull(),
  body: text("body").notNull(),
  status: activityStatusEnum("status").notNull().default("draft"),
  categoryId: varchar("category_id", { length: 24 })
    .notNull()
    .references(() => categories.id, { onDelete: "restrict" }),
  // Circular with media.activityId — the return type annotation is what lets
  // TypeScript resolve the cycle.
  coverMediaId: varchar("cover_media_id", { length: 24 }).references(
    (): AnyPgColumn => media.id,
    { onDelete: "set null" }
  ),
  authorId: varchar("author_id", { length: 24 })
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: text("seo_description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  // Postgres has no ON UPDATE clause; Drizzle stamps this on every update it
  // issues. Raw SQL updates outside the ORM will not touch it.
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const media = pgTable("media", {
  id: id(),
  activityId: varchar("activity_id", { length: 24 }).references(
    (): AnyPgColumn => activities.id,
    { onDelete: "set null" }
  ),
  url: varchar("url", { length: 600 }).notNull(),
  type: mediaTypeEnum("type").notNull().default("image"),
  altText: varchar("alt_text", { length: 300 }).notNull(),
  createdById: varchar("created_by_id", { length: 24 })
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const donations = pgTable("donations", {
  id: id(),
  donorName: varchar("donor_name", { length: 255 }),
  donorEmail: varchar("donor_email", { length: 255 }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("NGN"),
  method: donationMethodEnum("method").notNull().default("bank_transfer"),
  reference: varchar("reference", { length: 120 }), // what the donor quoted on the transfer
  transferredAt: timestamp("transferred_at", { withTimezone: true }),
  proofUrl: varchar("proof_url", { length: 600 }), // optional screenshot
  status: donationStatusEnum("status").notNull().default("pending"),
  // restrict: an activity with donations against it can never be deleted.
  activityId: varchar("activity_id", { length: 24 }).references(
    () => activities.id,
    { onDelete: "restrict" }
  ),
  receiptNo: varchar("receipt_no", { length: 60 }),
  consentContact: boolean("consent_contact").notNull().default(false),
  // which Admin confirmed — restrict, so attribution can't be erased
  confirmedById: varchar("confirmed_by_id", { length: 24 }).references(
    () => users.id,
    { onDelete: "restrict" }
  ),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: id(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  message: text("message").notNull(),
  status: contactStatusEnum("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: id(),
  // set null: the log row must survive the account it refers to.
  userId: varchar("user_id", { length: 24 }).references(() => users.id, {
    onDelete: "set null",
  }),
  action: varchar("action", { length: 120 }).notNull(),
  entity: varchar("entity", { length: 60 }).notNull(),
  entityId: varchar("entity_id", { length: 24 }),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const settings = pgTable("settings", {
  // org details, bank details, SEO defaults
  key: varchar("key", { length: 100 }).primaryKey(),
  value: jsonb("value").notNull(),
});
