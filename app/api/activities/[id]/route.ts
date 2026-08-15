import { and, eq, like, ne } from "drizzle-orm";

import { db } from "@/lib/db";
import { activities } from "@/db/schema";
import { can } from "@/lib/rbac";
import { HttpError, requirePermission, toResponse } from "@/lib/session";
import { activitySchema, fieldErrors } from "@/lib/validation";
import { slugify, uniqueSlug } from "@/lib/slug";

/**
 * Who may edit this row?
 *
 * Admins: anything. Editors: only their own, and only while it is still a
 * draft or has come back from review. Once something is published, an Editor
 * cannot touch it — otherwise "approved by an Admin" would mean nothing, since
 * they could rewrite the page afterwards.
 */
async function loadEditable(id: string, user: { id: string; role: string; active: boolean }) {
  const [row] = await db
    .select({
      id: activities.id,
      authorId: activities.authorId,
      status: activities.status,
      deletedAt: activities.deletedAt,
    })
    .from(activities)
    .where(eq(activities.id, id))
    .limit(1);

  if (!row || row.deletedAt) throw new HttpError(404, "No such activity.");

  const isAdmin = can(user as never, "activities.update.any");
  if (isAdmin) return row;

  if (row.authorId !== user.id) throw new HttpError(403, "Not allowed.");
  if (row.status !== "draft") {
    throw new HttpError(
      403,
      "This is no longer a draft. Ask an Admin to return it to you."
    );
  }
  return row;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission("activities.update.own");
    const { id } = await params;
    await loadEditable(id, user);

    const parsed = activitySchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input.", fields: fieldErrors(parsed.error) },
        { status: 422 }
      );
    }
    const data = parsed.data;

    const base = slugify(data.title);
    const clashes = await db
      .select({ slug: activities.slug })
      .from(activities)
      .where(and(like(activities.slug, `${base}%`), ne(activities.id, id)));

    await db
      .update(activities)
      .set({
        title: data.title,
        slug: uniqueSlug(base, clashes.map((c) => c.slug)),
        summary: data.summary,
        body: data.body,
        categoryId: data.categoryId,
        coverMediaId: data.coverMediaId ?? null,
        publishedAt: data.publishedAt ?? null,
        seoTitle: data.seoTitle ?? null,
        seoDescription: data.seoDescription ?? null,
      })
      .where(eq(activities.id, id));

    return Response.json({ ok: true });
  } catch (error) {
    return toResponse(error);
  }
}

/** Soft delete — the row stays so donations and media keep their references. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("activities.delete");
    const { id } = await params;
    await db
      .update(activities)
      .set({ deletedAt: new Date(), status: "archived" })
      .where(eq(activities.id, id));
    return Response.json({ ok: true });
  } catch (error) {
    return toResponse(error);
  }
}
