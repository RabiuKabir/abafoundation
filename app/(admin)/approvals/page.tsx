import { and, desc, eq, isNull } from "drizzle-orm";

import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/lib/db";
import { activities, categories, users } from "@/db/schema";
import { requirePageAccess } from "@/lib/session";
import { ApprovalsClient } from "./approvals-client";

export const metadata = { title: "Approvals" };

export default async function ApprovalsPage() {
  await requirePageAccess("activities.publish");

  const rows = await db
    .select({
      id: activities.id,
      title: activities.title,
      slug: activities.slug,
      summary: activities.summary,
      updatedAt: activities.updatedAt,
      categoryName: categories.name,
      authorName: users.name,
    })
    .from(activities)
    .innerJoin(categories, eq(categories.id, activities.categoryId))
    .innerJoin(users, eq(users.id, activities.authorId))
    .where(and(eq(activities.status, "in_review"), isNull(activities.deletedAt)))
    .orderBy(desc(activities.updatedAt));

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <PageHeader
        title="Approval queue"
        description="Drafts Editors have submitted. Nothing here is public until you approve it."
        action={
          rows.length ? (
            <Badge variant="warning">{rows.length} waiting</Badge>
          ) : null
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          className="mt-10"
          title="Nothing waiting"
          description="When an Editor submits a draft for review, it appears here."
        />
      ) : (
        <ApprovalsClient
          items={rows.map((r) => ({
            ...r,
            updatedAt: r.updatedAt.toISOString(),
          }))}
        />
      )}
    </div>
  );
}
