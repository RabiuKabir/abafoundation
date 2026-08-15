import { PageHeader } from "@/components/admin/page-header";
import { listAllCategories } from "@/lib/activities";
import { can } from "@/lib/rbac";
import { requirePageAccess } from "@/lib/session";
import { ActivityEditor } from "../activity-editor";

export const metadata = { title: "New activity" };

export default async function NewActivityPage() {
  const user = await requirePageAccess("activities.create");
  const categories = await listAllCategories();

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <PageHeader
        title="New activity"
        description="Write what happened, who it reached, and what changed. Plain language beats grand language."
      />
      <ActivityEditor
        activity={null}
        categories={categories}
        canPublish={can(user, "activities.publish")}
      />
    </div>
  );
}
