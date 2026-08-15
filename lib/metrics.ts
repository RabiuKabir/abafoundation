import "server-only";

import { and, desc, eq, isNull, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { activities, contacts, donations } from "@/db/schema";

/**
 * Dashboard numbers.
 *
 * HARD RULE 1 lives here too: every money figure filters on
 * `status = 'confirmed'`. Pending pledges are counted separately, as work to
 * do — never as money raised.
 */
export async function getDashboardMetrics() {
  // Bind as an ISO string and cast in SQL. A raw JS Date inside a drizzle
  // `sql` template reaches the driver as an object it can't serialise, which
  // fails at query time rather than at compile time.
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const [money] = await db
    .select({
      confirmed30d: sql<string>`coalesce(sum(${donations.amount}) filter (
        where ${donations.status} = 'confirmed' and ${donations.confirmedAt} >= ${thirtyDaysAgo}::timestamptz
      ), 0)::text`,
      confirmedAllTime: sql<string>`coalesce(sum(${donations.amount}) filter (
        where ${donations.status} = 'confirmed'
      ), 0)::text`,
      pendingCount: sql<number>`count(*) filter (where ${donations.status} = 'pending')::int`,
    })
    .from(donations);

  const [review] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(activities)
    .where(and(eq(activities.status, "in_review"), isNull(activities.deletedAt)));

  const [messages] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contacts)
    .where(eq(contacts.status, "new"));

  const recent = await db
    .select({
      id: donations.id,
      donorName: donations.donorName,
      amount: donations.amount,
      currency: donations.currency,
      status: donations.status,
      createdAt: donations.createdAt,
    })
    .from(donations)
    .orderBy(desc(donations.createdAt))
    .limit(5);

  return {
    confirmed30d: money?.confirmed30d ?? "0",
    confirmedAllTime: money?.confirmedAllTime ?? "0",
    pendingCount: money?.pendingCount ?? 0,
    awaitingReview: review?.count ?? 0,
    newMessages: messages?.count ?? 0,
    recent,
  };
}
