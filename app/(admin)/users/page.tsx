import { asc } from "drizzle-orm";

import { PageHeader } from "@/components/admin/page-header";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { requirePageAccess } from "@/lib/session";
import { UsersClient } from "./users-client";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  // Server-side gate. Middleware already bounced Editors, but this repeats the
  // check against the database — a page must never rely on middleware.
  const me = await requirePageAccess("users.read");

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      active: users.active,
      mustChangePassword: users.mustChangePassword,
    })
    .from(users)
    .orderBy(asc(users.createdAt));

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <PageHeader
        title="Users"
        description="Staff accounts. Editors can only work on their own drafts; Admins can do everything, so keep the number small."
      />
      <UsersClient initialUsers={rows} currentUserId={me.id} />
    </div>
  );
}
