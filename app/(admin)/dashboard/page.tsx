import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { can } from "@/lib/rbac";
import { getDashboardMetrics } from "@/lib/metrics";
import { formatMoney } from "@/lib/money";
import { requirePageAccess } from "@/lib/session";

export const metadata = { title: "Dashboard" };

const STATUS_VARIANT = {
  pending: "warning",
  confirmed: "success",
  rejected: "danger",
} as const;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const user = await requirePageAccess("activities.read.any");
  const { denied } = await searchParams;

  // Editors have no business seeing the money — don't even run the query.
  const showMoney = can(user, "donations.read");
  const metrics = showMoney ? await getDashboardMetrics() : null;

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <PageHeader
        title={`Welcome, ${user.name.split(" ")[0]}`}
        description="An overview of giving, content and messages."
        action={<Badge variant="info">Signed in as {user.role}</Badge>}
      />

      {denied ? (
        <p
          role="alert"
          className="mt-6 rounded-lg border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning"
        >
          You don&apos;t have access to that section. If you think you should,
          ask an Admin.
        </p>
      ) : null}

      {metrics ? (
        <>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <Card size="sm">
              <CardContent>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Confirmed raised (30d)
                </p>
                <p className="mt-3 text-3xl font-semibold tabular-nums text-navy">
                  {formatMoney(metrics.confirmed30d)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Confirmed donations only
                </p>
              </CardContent>
            </Card>

            <Card size="sm">
              <CardContent>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Pending pledges
                </p>
                <p className="mt-3 text-3xl font-semibold tabular-nums text-navy">
                  {metrics.pendingCount}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  <Link href="/donations?status=pending" className="text-teal hover:underline">
                    Awaiting your check →
                  </Link>
                </p>
              </CardContent>
            </Card>

            <Card size="sm">
              <CardContent>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Awaiting review
                </p>
                <p className="mt-3 text-3xl font-semibold tabular-nums text-navy">
                  {metrics.awaitingReview}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  <Link href="/approvals" className="text-teal hover:underline">
                    Drafts submitted by Editors →
                  </Link>
                </p>
              </CardContent>
            </Card>

            <Card size="sm">
              <CardContent>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  New messages
                </p>
                <p className="mt-3 text-3xl font-semibold tabular-nums text-navy">
                  {metrics.newMessages}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  From the contact form
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-8">
            <CardContent>
              <CardTitle className="text-lg">Recent donations</CardTitle>
              {metrics.recent.length === 0 ? (
                <EmptyState
                  className="mt-6"
                  title="No donations yet"
                  description="Pledges from the public Donate page land here as pending, and stay pending until an Admin confirms them against the bank statement."
                />
              ) : (
                <table className="mt-6 w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-3 font-medium text-muted-foreground">Donor</th>
                      <th className="pb-3 font-medium text-muted-foreground">Amount</th>
                      <th className="pb-3 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.recent.map((d) => (
                      <tr key={d.id} className="border-b border-border/60 last:border-0">
                        <td className="py-3 text-navy">{d.donorName ?? "Anonymous"}</td>
                        <td className="py-3 tabular-nums">
                          {formatMoney(d.amount, d.currency)}
                        </td>
                        <td className="py-3">
                          <Badge variant={STATUS_VARIANT[d.status]}>{d.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="mt-8">
          <CardContent>
            <CardTitle className="text-lg">Your drafts</CardTitle>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Head to Activities to write something or pick up where you left
              off. Submit a draft when it&apos;s ready and an Admin will review
              it.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
