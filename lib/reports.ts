import "server-only";

import { and, desc, eq, gte, lte, sql, type SQL } from "drizzle-orm";

import { db } from "@/lib/db";
import { activities, categories, donations, users } from "@/db/schema";

export type ReportFilters = {
  from?: string | null;
  to?: string | null;
  categorySlug?: string | null;
  status?: "pending" | "confirmed" | "rejected" | null;
};

/**
 * Build the WHERE for a report.
 *
 * The default status is `confirmed` — Hard Rule 1. Someone can deliberately
 * ask for pending or rejected rows (useful for chasing), but they have to ask;
 * the number you get without thinking about it is the true one.
 *
 * Dates are bound as ISO strings and cast in SQL — a raw JS Date inside a
 * drizzle template reaches the driver as an object it can't serialise.
 */
export function reportWhere(filters: ReportFilters): SQL | undefined {
  const clauses: SQL[] = [];

  clauses.push(eq(donations.status, filters.status ?? "confirmed"));

  if (filters.from) {
    clauses.push(gte(donations.createdAt, new Date(filters.from)));
  }
  if (filters.to) {
    // Inclusive of the whole end day.
    const end = new Date(filters.to);
    end.setHours(23, 59, 59, 999);
    clauses.push(lte(donations.createdAt, end));
  }
  if (filters.categorySlug) {
    clauses.push(eq(categories.slug, filters.categorySlug));
  }

  return clauses.length ? and(...clauses) : undefined;
}

export async function getReport(filters: ReportFilters) {
  const where = reportWhere(filters);

  const [summary] = await db
    .select({
      total: sql<string>`coalesce(sum(${donations.amount}), 0)::text`,
      count: sql<number>`count(*)::int`,
      average: sql<string>`coalesce(round(avg(${donations.amount}), 2), 0)::text`,
    })
    .from(donations)
    .leftJoin(activities, eq(activities.id, donations.activityId))
    .leftJoin(categories, eq(categories.id, activities.categoryId))
    .where(where);

  const byCategory = await db
    .select({
      category: sql<string>`coalesce(${categories.name}, 'Unallocated')`,
      count: sql<number>`count(*)::int`,
      total: sql<string>`coalesce(sum(${donations.amount}), 0)::text`,
    })
    .from(donations)
    .leftJoin(activities, eq(activities.id, donations.activityId))
    .leftJoin(categories, eq(categories.id, activities.categoryId))
    .where(where)
    .groupBy(sql`coalesce(${categories.name}, 'Unallocated')`)
    .orderBy(sql`sum(${donations.amount}) desc nulls last`);

  return { summary, byCategory };
}

/** The rows behind the report — also what the CSV export writes. */
export async function getReportRows(filters: ReportFilters) {
  return db
    .select({
      id: donations.id,
      createdAt: donations.createdAt,
      transferredAt: donations.transferredAt,
      confirmedAt: donations.confirmedAt,
      donorName: donations.donorName,
      donorEmail: donations.donorEmail,
      amount: donations.amount,
      currency: donations.currency,
      method: donations.method,
      status: donations.status,
      reference: donations.reference,
      receiptNo: donations.receiptNo,
      category: categories.name,
      activityTitle: activities.title,
      confirmedBy: users.email,
    })
    .from(donations)
    .leftJoin(activities, eq(activities.id, donations.activityId))
    .leftJoin(categories, eq(categories.id, activities.categoryId))
    .leftJoin(users, eq(users.id, donations.confirmedById))
    .where(reportWhere(filters))
    .orderBy(desc(donations.createdAt));
}
