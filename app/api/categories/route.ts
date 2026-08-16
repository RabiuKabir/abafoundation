import { eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { activities, categories } from "@/db/schema";
import { HttpError, requirePermission, toResponse } from "@/lib/session";
import { categorySchema, fieldErrors } from "@/lib/validation";
import { slugify, uniqueSlug } from "@/lib/slug";

export async function GET() {
  try {
    await requirePermission("settings.read");
    const rows = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        used: sql<number>`(select count(*) from ${activities} where ${activities.categoryId} = ${categories.id})::int`,
      })
      .from(categories)
      .orderBy(categories.name);
    return Response.json({ categories: rows });
  } catch (error) {
    return toResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission("settings.update");

    const parsed = categorySchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input.", fields: fieldErrors(parsed.error) },
        { status: 422 }
      );
    }

    const base = slugify(parsed.data.name);
    const existing = await db.select({ slug: categories.slug }).from(categories);
    const [created] = await db
      .insert(categories)
      .values({
        name: parsed.data.name,
        slug: uniqueSlug(base, existing.map((c) => c.slug)),
      })
      .returning({ id: categories.id, name: categories.name });

    return Response.json({ category: created }, { status: 201 });
  } catch (error) {
    return toResponse(error);
  }
}

/**
 * Deleting a category that activities point at would break them, and the
 * database would refuse anyway — the foreign key is ON DELETE RESTRICT. Catch
 * it here so the Admin gets an explanation instead of a 500.
 */
export async function DELETE(request: Request) {
  try {
    await requirePermission("settings.update");
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw new HttpError(422, "Which category?");

    const [inUse] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(activities)
      .where(eq(activities.categoryId, id));

    if (inUse && inUse.n > 0) {
      throw new HttpError(
        409,
        `${inUse.n} ${inUse.n === 1 ? "activity uses" : "activities use"} this category. Move them first.`
      );
    }

    await db.delete(categories).where(eq(categories.id, id));
    return Response.json({ ok: true });
  } catch (error) {
    return toResponse(error);
  }
}
