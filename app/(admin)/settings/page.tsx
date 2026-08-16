import { sql } from "drizzle-orm";

import { PageHeader } from "@/components/admin/page-header";
import { db } from "@/lib/db";
import { activities, categories } from "@/db/schema";
import { getBankDetails, getOrgDetails } from "@/lib/settings";
import { requirePageAccess } from "@/lib/session";
import { SettingsClient } from "./settings-client";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requirePageAccess("settings.read");

  const [org, bank, cats] = await Promise.all([
    getOrgDetails(),
    getBankDetails(),
    db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        used: sql<number>`(select count(*) from ${activities} where ${activities.categoryId} = ${categories.id})::int`,
      })
      .from(categories)
      .orderBy(categories.name),
  ]);

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <PageHeader
        title="Settings"
        description="Organisation details, the bank details donors see, and the programme categories."
      />
      <SettingsClient org={org ?? {}} bank={bank ?? {}} categories={cats} />
    </div>
  );
}
