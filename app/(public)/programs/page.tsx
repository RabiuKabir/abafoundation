import Link from "next/link";

import { ActivityCard } from "@/components/public/activity-card";
import { Container, Section } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import {
  listCategoriesWithPublished,
  listPublicActivities,
} from "@/lib/activities";

/**
 * Rendered per request, not at build time.
 *
 * Two reasons: an Admin who approves a story expects it live immediately, not
 * after the next deploy; and a prerendered build would need the database to be
 * reachable from wherever `next build` runs. Traffic here is small, so a query
 * per request is the cheaper trade. Revisit caching in Phase 5 if that changes.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Programs",
  description:
    "Scholarships, empowerment grants, community service and direct help — what ABA Foundation is doing, and where.",
};

const PER_PAGE = 9;

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const { category, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [{ items, total, pages }, categories] = await Promise.all([
    listPublicActivities({ categorySlug: category, page, perPage: PER_PAGE }),
    listCategoriesWithPublished(),
  ]);

  const href = (next: { category?: string; page?: number }) => {
    const params = new URLSearchParams();
    const cat = "category" in next ? next.category : category;
    if (cat) params.set("category", cat);
    if (next.page && next.page > 1) params.set("page", String(next.page));
    const qs = params.toString();
    return qs ? `/programs?${qs}` : "/programs";
  };

  return (
    <Section>
      <Container>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Our programs
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink/75">
          Every entry below is something that actually happened, written up by
          the people who were there.
        </p>

        {categories.length > 0 ? (
          <nav aria-label="Filter by category" className="mt-10 flex flex-wrap gap-2">
            <Link
              href={href({ category: undefined, page: 1 })}
              aria-current={!category ? "page" : undefined}
              className={cn(
                "rounded-pill border px-4 py-2 text-sm font-medium transition-colors",
                !category
                  ? "border-navy bg-navy text-primary-foreground"
                  : "border-border bg-surface text-ink/75 hover:border-teal hover:text-teal"
              )}
            >
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={href({ category: c.slug, page: 1 })}
                aria-current={category === c.slug ? "page" : undefined}
                className={cn(
                  "rounded-pill border px-4 py-2 text-sm font-medium transition-colors",
                  category === c.slug
                    ? "border-navy bg-navy text-primary-foreground"
                    : "border-border bg-surface text-ink/75 hover:border-teal hover:text-teal"
                )}
              >
                {c.name}
              </Link>
            ))}
          </nav>
        ) : null}

        {items.length === 0 ? (
          <EmptyState
            className="mt-12"
            title="Nothing published here yet"
            description={
              category
                ? "No stories in this category so far. Try another, or check back soon."
                : "The first stories are being written. Check back shortly."
            }
          />
        ) : (
          <>
            <p className="mt-8 text-sm text-muted-foreground" aria-live="polite">
              {total} {total === 1 ? "story" : "stories"}
              {category ? " in this category" : ""}
            </p>

            <div className="mt-6 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {items.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>

            {pages > 1 ? (
              <nav
                aria-label="Pagination"
                className="mt-14 flex items-center justify-center gap-2"
              >
                {page > 1 ? (
                  <Link
                    href={href({ page: page - 1 })}
                    rel="prev"
                    className="rounded-button border border-border bg-surface px-4 py-2 text-sm hover:border-teal hover:text-teal"
                  >
                    ‹ Previous
                  </Link>
                ) : null}
                <span className="px-3 text-sm text-muted-foreground">
                  Page {page} of {pages}
                </span>
                {page < pages ? (
                  <Link
                    href={href({ page: page + 1 })}
                    rel="next"
                    className="rounded-button border border-border bg-surface px-4 py-2 text-sm hover:border-teal hover:text-teal"
                  >
                    Next ›
                  </Link>
                ) : null}
              </nav>
            ) : null}
          </>
        )}
      </Container>
    </Section>
  );
}
