import type { MetadataRoute } from "next";

import { listPublishedSlugs } from "@/lib/activities";
import { siteUrl } from "@/lib/site";

/**
 * Rendered per request, not at build time.
 *
 * Two reasons: an Admin who approves a story expects it live immediately, not
 * after the next deploy; and a prerendered build would need the database to be
 * reachable from wherever `next build` runs. Traffic here is small, so a query
 * per request is the cheaper trade. Revisit caching in Phase 5 if that changes.
 */
export const dynamic = "force-dynamic";

/**
 * Only published activities appear here. A draft leaking into the sitemap
 * would hand search engines a URL that 404s — and would quietly contradict
 * the Phase 2 gate.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/programs`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/donate`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];

  let activities: MetadataRoute.Sitemap = [];
  try {
    const rows = await listPublishedSlugs();
    activities = rows.map((row) => ({
      url: `${base}/programs/${row.slug}`,
      lastModified: row.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  } catch {
    // A database hiccup shouldn't make the whole sitemap 500 — better to
    // serve the static pages than nothing.
  }

  return [...staticPages, ...activities];
}
