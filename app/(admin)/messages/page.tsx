import { desc, eq } from "drizzle-orm";

import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { db } from "@/lib/db";
import { contacts } from "@/db/schema";
import { requirePageAccess } from "@/lib/session";
import { MessagesClient } from "./messages-client";

export const metadata = { title: "Messages" };

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requirePageAccess("messages.read");
  const { status } = await searchParams;
  const valid = status === "new" || status === "handled" ? status : "";

  const rows = await db
    .select({
      id: contacts.id,
      name: contacts.name,
      email: contacts.email,
      message: contacts.message,
      status: contacts.status,
      createdAt: contacts.createdAt,
    })
    .from(contacts)
    .where(valid ? eq(contacts.status, valid) : undefined)
    .orderBy(desc(contacts.createdAt));

  const newCount = rows.filter((r) => r.status === "new").length;

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <PageHeader
        title="Contact inbox"
        description="Everything sent through the public contact form."
        action={newCount ? <Badge variant="warning">{newCount} new</Badge> : null}
      />

      {rows.length === 0 ? (
        <EmptyState
          className="mt-10"
          title="No messages"
          description="Enquiries from the contact form land here. Nothing yet."
        />
      ) : (
        <MessagesClient
          rows={rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))}
          filter={valid}
        />
      )}
    </div>
  );
}
