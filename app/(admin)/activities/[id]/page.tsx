import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/page-header";
import { db } from "@/lib/db";
import { activities, media } from "@/db/schema";
import { listAllCategories } from "@/lib/activities";
import { can } from "@/lib/rbac";
import { requirePageAccess } from "@/lib/session";
import { ActivityEditor } from "../activity-editor";

export const metadata = { title: "Edit activity" };

export default async function EditActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePageAccess("activities.create");
  const { id } = await params;

  const [row] = await db
    .select({
      id: activities.id,
      title: activities.title,
      slug: activities.slug,
      summary: activities.summary,
      body: activities.body,
      categoryId: activities.categoryId,
      coverMediaId: activities.coverMediaId,
      publishedAt: activities.publishedAt,
      seoTitle: activities.seoTitle,
      seoDescription: activities.seoDescription,
      status: activities.status,
      authorId: activities.authorId,
      deletedAt: activities.deletedAt,
      coverUrl: media.url,
      coverAlt: media.altText,
    })
    .from(activities)
    .leftJoin(media, eq(media.id, activities.coverMediaId))
    .where(eq(activities.id, id))
    .limit(1);

  if (!row || row.deletedAt) notFound();

  // An Editor may only open their own. Checked here, on the server, so a
  // guessed id in the URL bar gets the same answer as a hidden link.
  if (!can(user, "activities.update.any") && row.authorId !== user.id) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <PageHeader title={row.title} description={`/programs/${row.slug}`} />
      <ActivityEditor
        activity={{
          ...row,
          publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
        }}
        categories={await listAllCategories()}
        canPublish={can(user, "activities.publish")}
      />
    </div>
  );
}
