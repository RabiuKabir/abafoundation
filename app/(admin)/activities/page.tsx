import Link from "next/link";

import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { listActivitiesForStaff } from "@/lib/activities";
import { can } from "@/lib/rbac";
import { requirePageAccess } from "@/lib/session";

export const metadata = { title: "Activities" };

export default async function ActivitiesPage() {
  const user = await requirePageAccess("activities.create");

  // Editors see only their own. Scoped in the query — not hidden in the view.
  const rows = await listActivitiesForStaff(
    can(user, "activities.update.any") ? {} : { authorId: user.id }
  );

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <PageHeader
        title="Activities"
        description={
          can(user, "activities.update.any")
            ? "Every story, at every stage."
            : "Your drafts. Submit one for review when it's ready — an Admin publishes it."
        }
        action={
          <Link href="/activities/new" className={buttonVariants()}>
            + New activity
          </Link>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          className="mt-10"
          title="Nothing written yet"
          description="Start with one story — what happened, who it reached, and what changed."
          action={
            <Link href="/activities/new" className={buttonVariants()}>
              Write the first one
            </Link>
          }
        />
      ) : (
        <Card className="mt-8 overflow-x-auto">
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Title</th>
                  <th className="pb-3 font-medium text-muted-foreground">Category</th>
                  <th className="pb-3 font-medium text-muted-foreground">Status</th>
                  <th className="pb-3 font-medium text-muted-foreground">Updated</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/60 last:border-0">
                    <td className="py-4 font-medium text-navy">{row.title}</td>
                    <td className="py-4 text-muted-foreground">{row.categoryName}</td>
                    <td className="py-4">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="py-4 text-muted-foreground">
                      {new Date(row.updatedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-4 text-right">
                      <Link
                        href={`/activities/${row.id}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
