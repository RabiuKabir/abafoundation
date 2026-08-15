import { and, desc, eq, sql } from "drizzle-orm";

import { PageHeader } from "@/components/admin/page-header";
import { db } from "@/lib/db";
import { donations, users } from "@/db/schema";
import { requirePageAccess } from "@/lib/session";
import { DonationsClient } from "./donations-client";

export const metadata = { title: "Donations" };

export default async function DonationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requirePageAccess("donations.read");
  const { status } = await searchParams;

  const valid =
    status === "pending" || status === "confirmed" || status === "rejected"
      ? status
      : "";

  const rows = await db
    .select({
      id: donations.id,
      donorName: donations.donorName,
      donorEmail: donations.donorEmail,
      amount: donations.amount,
      currency: donations.currency,
      method: donations.method,
      status: donations.status,
      reference: donations.reference,
      transferredAt: donations.transferredAt,
      proofUrl: donations.proofUrl,
      createdAt: donations.createdAt,
      confirmedByName: users.name,
    })
    .from(donations)
    .leftJoin(users, eq(users.id, donations.confirmedById))
    .where(valid ? and(eq(donations.status, valid)) : undefined)
    .orderBy(desc(donations.createdAt));

  // Hard Rule 1 — the total counts confirmed rows and nothing else.
  const [totals] = await db
    .select({
      confirmedTotal: sql<string>`coalesce(sum(${donations.amount}) filter (where ${donations.status} = 'confirmed'), 0)::text`,
    })
    .from(donations);

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <PageHeader
        title="Donations"
        description="Every transfer is checked against the bank statement by a person before it counts. Nothing here confirms itself."
      />
      <DonationsClient
        rows={rows.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
          transferredAt: r.transferredAt ? r.transferredAt.toISOString() : null,
        }))}
        confirmedTotal={totals?.confirmedTotal ?? "0"}
        filter={valid}
      />
    </div>
  );
}
