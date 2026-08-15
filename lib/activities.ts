import "server-only";

import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { activities, categories, media } from "@/db/schema";

/**
 * The single definition of "publicly visible".
 *
 * Phase 2's gate depends on this being the ONLY way public pages reach
 * content: published, not soft-deleted, and past its publish date. Every
 * public query composes this — none of them filter by hand.
 */
export function publicFilter() {
  return and(
    eq(activities.status, "published"),
    isNull(activities.deletedAt),
    sql`(${activities.publishedAt} is null or ${activities.publishedAt} <= now())`
  );
}

const publicColumns = {
  id: activities.id,
  title: activities.title,
  slug: activities.slug,
  summary: activities.summary,
  body: activities.body,
  publishedAt: activities.publishedAt,
  seoTitle: activities.seoTitle,
  seoDescription: activities.seoDescription,
  categoryName: categories.name,
  categorySlug: categories.slug,
  coverUrl: media.url,
  coverAlt: media.altText,
};

export type PublicActivity = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  publishedAt: Date | null;
  seoTitle: string | null;
  seoDescription: string | null;
  categoryName: string;
  categorySlug: string;
  coverUrl: string | null;
  coverAlt: string | null;
};

export async function listPublicActivities({
  categorySlug,
  page = 1,
  perPage = 9,
}: {
  categorySlug?: string;
  page?: number;
  perPage?: number;
} = {}): Promise<{ items: PublicActivity[]; total: number; pages: number }> {
  const where = categorySlug
    ? and(publicFilter(), eq(categories.slug, categorySlug))
    : publicFilter();

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(activities)
    .innerJoin(categories, eq(categories.id, activities.categoryId))
    .where(where);

  const items = (await db
    .select(publicColumns)
    .from(activities)
    .innerJoin(categories, eq(categories.id, activities.categoryId))
    .leftJoin(media, eq(media.id, activities.coverMediaId))
    .where(where)
    .orderBy(desc(sql`coalesce(${activities.publishedAt}, ${activities.createdAt})`))
    .limit(perPage)
    .offset((page - 1) * perPage)) as PublicActivity[];

  return { items, total: count, pages: Math.max(1, Math.ceil(count / perPage)) };
}

export async function getPublicActivityBySlug(
  slug: string
): Promise<PublicActivity | null> {
  const [row] = (await db
    .select(publicColumns)
    .from(activities)
    .innerJoin(categories, eq(categories.id, activities.categoryId))
    .leftJoin(media, eq(media.id, activities.coverMediaId))
    .where(and(publicFilter(), eq(activities.slug, slug)))
    .limit(1)) as PublicActivity[];

  return row ?? null;
}

/** Gallery images for a published activity (the cover is shown separately). */
export async function getActivityGallery(activityId: string) {
  return db
    .select({ id: media.id, url: media.url, altText: media.altText })
    .from(media)
    .where(eq(media.activityId, activityId));
}

/** Only categories that actually have something published behind them. */
export async function listCategoriesWithPublished() {
  return db
    .selectDistinct({ name: categories.name, slug: categories.slug })
    .from(categories)
    .innerJoin(activities, eq(activities.categoryId, categories.id))
    .where(publicFilter())
    .orderBy(categories.name);
}

export async function listAllCategories() {
  return db
    .select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(categories)
    .orderBy(categories.name);
}

/** Every published slug — used by sitemap.xml. */
export async function listPublishedSlugs() {
  return db
    .select({ slug: activities.slug, updatedAt: activities.updatedAt })
    .from(activities)
    .where(publicFilter());
}

/** Admin/editor listing. Editors are scoped to their own drafts by authorId. */
export async function listActivitiesForStaff({
  authorId,
  statuses,
}: {
  authorId?: string;
  statuses?: ("draft" | "in_review" | "published" | "archived")[];
} = {}) {
  const clauses = [isNull(activities.deletedAt)];
  if (authorId) clauses.push(eq(activities.authorId, authorId));
  if (statuses?.length) clauses.push(inArray(activities.status, statuses));

  return db
    .select({
      id: activities.id,
      title: activities.title,
      slug: activities.slug,
      status: activities.status,
      updatedAt: activities.updatedAt,
      authorId: activities.authorId,
      categoryName: categories.name,
    })
    .from(activities)
    .innerJoin(categories, eq(categories.id, activities.categoryId))
    .where(and(...clauses))
    .orderBy(desc(activities.updatedAt));
}
