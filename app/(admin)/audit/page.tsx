import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";

import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/lib/db";
import { auditLogs, users } from "@/db/schema";
import { formatMoney } from "@/lib/money";
import { requirePageAccess } from "@/lib/session";

export const metadata = { title: "Audit log" };

const PER_PAGE = 50;

/** Which actions are worth flagging as money-touching. */
const MONEY_ACTIONS = new Set([
  "donation.confirm",
  "donation.reject",
  "donation.create.offline",
  "report.export",
]);

function describe(action: string, meta: Record<string, unknown> | null): string {
  const m = meta ?? {};
  switch (action) {
    case "donation.create.public":
      return `A donor reported a transfer of ${formatMoney(String(m.amount ?? ""))}`;
    case "donation.confirm":
      return `Confirmed ${formatMoney(String(m.amount ?? ""))} against the bank statement`;
    case "donation.reject":
      return `Rejected ${formatMoney(String(m.amount ?? ""))}${m.note ? ` — ${m.note}` : ""}`;
    case "donation.create.offline":
      return `Recorded ${formatMoney(String(m.amount ?? ""))} received offline (${m.method})`;
    case "user.create":
      return `Created ${m.email} as ${m.role}`;
    case "user.role.change":
      return `Changed ${m.email} from ${m.from} to ${m.to}`;
    case "user.activate":
      return `Reactivated ${m.email}`;
    case "user.deactivate":
      return `Deactivated ${m.email}`;
    case "activity.reassign":
      return `Moved ${m.count} draft(s) from ${m.from} to ${m.to}`;
    case "activity.publish":
      return `Published an activity (was ${m.previousStatus})`;
    case "activity.return":
      return `Returned an activity to its author${m.note ? ` — ${m.note}` : ""}`;
    case "message.handle":
      return `Marked a message from ${m.from} as ${m.status}`;
    case "report.export":
      return `Exported ${m.rows} donation row(s) to CSV`;
    case "settings.update":
      return `Updated the ${m.group} settings`;
    default:
      return action;
  }
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requirePageAccess("audit.read");
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(auditLogs);

  const rows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entity: auditLogs.entity,
      entityId: auditLogs.entityId,
      meta: auditLogs.meta,
      createdAt: auditLogs.createdAt,
      userEmail: users.email,
      userName: users.name,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.userId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(PER_PAGE)
    .offset((page - 1) * PER_PAGE);

  const pages = Math.max(1, Math.ceil(count / PER_PAGE));

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <PageHeader
        title="Audit log"
        description="A read-only record of who did what. Nothing here can be edited or deleted, including by an Admin."
      />

      {rows.length === 0 ? (
        <EmptyState
          className="mt-10"
          title="Nothing recorded yet"
          description="Confirming a donation, changing a role or editing settings will each leave a line here."
        />
      ) : (
        <>
          <Card className="mt-8 overflow-x-auto">
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 font-medium text-muted-foreground">When</th>
                    <th className="pb-3 font-medium text-muted-foreground">Who</th>
                    <th className="pb-3 font-medium text-muted-foreground">What</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-border/60 last:border-0">
                      <td className="py-3 align-top whitespace-nowrap text-muted-foreground tabular-nums">
                        {new Date(r.createdAt).toLocaleString("en-GB", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 align-top">
                        {r.userName ? (
                          <span className="text-navy">{r.userName}</span>
                        ) : (
                          <span className="text-muted-foreground italic">
                            public
                          </span>
                        )}
                      </td>
                      <td className="py-3 align-top">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-ink/85">
                            {describe(r.action, r.meta as Record<string, unknown> | null)}
                          </span>
                          {MONEY_ACTIONS.has(r.action) ? (
                            <Badge variant="info">money</Badge>
                          ) : null}
                        </div>
                        <code className="mt-0.5 block text-xs text-muted-foreground">
                          {r.action}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {pages > 1 ? (
            <nav
              aria-label="Pagination"
              className="mt-8 flex items-center justify-center gap-3 text-sm"
            >
              {page > 1 ? (
                <Link href={`/audit?page=${page - 1}`} className="text-teal hover:underline">
                  ‹ Newer
                </Link>
              ) : null}
              <span className="text-muted-foreground">
                Page {page} of {pages} · {count} entries
              </span>
              {page < pages ? (
                <Link href={`/audit?page=${page + 1}`} className="text-teal hover:underline">
                  Older ›
                </Link>
              ) : null}
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
