import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { requirePageAccess } from "@/lib/session";

export const metadata = { title: "Approvals" };

export default async function Page() {
  // Hard Rule 2 — the server decides, every time.
  await requirePageAccess("activities.publish");

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <PageHeader
        title="Approvals"
        description="Drafts submitted by Editors, waiting for an Admin to approve and publish."
        action={<Badge variant="info">Arrives in a later phase</Badge>}
      />
      <EmptyState
        className="mt-10"
        title="Nothing here yet"
        description="This section is a guarded shell. The route already refuses anyone without permission — the features land in a later phase."
      />
    </div>
  );
}
