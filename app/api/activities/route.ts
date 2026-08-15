import { eq, like } from "drizzle-orm";

import { db } from "@/lib/db";
import { activities, categories } from "@/db/schema";
import { can } from "@/lib/rbac";
import { requirePermission, toResponse } from "@/lib/session";
import { activitySchema, fieldErrors } from "@/lib/validation";
import { slugify, uniqueSlug } from "@/lib/slug";
import { listActivitiesForStaff } from "@/lib/activities";

export async function GET() {
  try {
    const user = await requirePermission("activities.read.any");
    // Editors see only their own drafts — enforced in the query, not the UI.
    const rows = await listActivitiesForStaff(
      can(user, "activities.update.any") ? {} : { authorId: user.id }
    );
    return Response.json({ activities: rows });
  } catch (error) {
    return toResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission("activities.create");

    const parsed = activitySchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input.", fields: fieldErrors(parsed.error) },
        { status: 422 }
      );
    }
    const data = parsed.data;

    const [category] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, data.categoryId))
      .limit(1);
    if (!category) {
      return Response.json(
        { error: "Invalid input.", fields: { categoryId: "Unknown category." } },
        { status: 422 }
      );
    }

    const base = slugify(data.title);
    const clashes = await db
      .select({ slug: activities.slug })
      .from(activities)
      .where(like(activities.slug, `${base}%`));

    const [created] = await db
      .insert(activities)
      .values({
        title: data.title,
        slug: uniqueSlug(base, clashes.map((c) => c.slug)),
        summary: data.summary,
        body: data.body,
        categoryId: data.categoryId,
        coverMediaId: data.coverMediaId ?? null,
        authorId: user.id,
        publishedAt: data.publishedAt ?? null,
        seoTitle: data.seoTitle ?? null,
        seoDescription: data.seoDescription ?? null,
        // Always a draft. Nothing reaches the public without passing through
        // in_review and an Admin's approval — that is the Phase 2 gate.
        status: "draft",
      })
      .returning({ id: activities.id, slug: activities.slug });

    return Response.json({ activity: created }, { status: 201 });
  } catch (error) {
    return toResponse(error);
  }
}
