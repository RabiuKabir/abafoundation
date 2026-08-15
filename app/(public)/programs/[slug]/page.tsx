import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { Container, Section } from "@/components/ui/container";
import {
  getActivityGallery,
  getPublicActivityBySlug,
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

/**
 * SEO comes from the activity's own fields, falling back to the visible copy
 * so a page is never published with an empty description.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const activity = await getPublicActivityBySlug(slug);
  if (!activity) return { title: "Not found" };

  const title = activity.seoTitle || activity.title;
  const description = activity.seoDescription || activity.summary;

  return {
    title,
    description,
    alternates: { canonical: `/programs/${activity.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      images: activity.coverUrl ? [{ url: activity.coverUrl }] : undefined,
    },
  };
}

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // This resolves only published, non-deleted rows — a draft's URL 404s even
  // if someone knows the slug. That is the Phase 2 gate.
  const activity = await getPublicActivityBySlug(slug);
  if (!activity) notFound();

  const gallery = await getActivityGallery(activity.id);
  const date = activity.publishedAt
    ? new Date(activity.publishedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <Section>
      <Container width="narrow">
        <p className="text-xs font-medium tracking-wide text-teal uppercase">
          <Link
            href={`/programs?category=${activity.categorySlug}`}
            className="hover:underline"
          >
            {activity.categoryName}
          </Link>
          {date ? <span className="text-muted-foreground"> · {date}</span> : null}
        </p>

        <h1 className="mt-5 text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
          {activity.title}
        </h1>

        <p className="mt-6 text-lg leading-relaxed text-ink/75">
          {activity.summary}
        </p>
      </Container>

      {activity.coverUrl ? (
        <Container className="mt-12">
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl shadow-soft">
            <Image
              src={activity.coverUrl}
              alt={activity.coverAlt ?? ""}
              fill
              priority
              sizes="(min-width: 1100px) 1100px, 100vw"
              className="object-cover"
            />
          </div>
        </Container>
      ) : null}

      <Container width="narrow" className="mt-12">
        <div className="prose-editorial">
          {activity.body
            .split(/\n{2,}/)
            .filter(Boolean)
            .map((paragraph, i) => (
              <p key={i} className="mb-6 text-lg leading-[1.75] text-ink/85">
                {paragraph}
              </p>
            ))}
        </div>
      </Container>

      {gallery.length > 0 ? (
        <Container className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight">
            From the day
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((image) => (
              <div
                key={image.id}
                className="relative aspect-[4/3] overflow-hidden rounded-lg shadow-soft"
              >
                <Image
                  src={image.url}
                  alt={image.altText}
                  fill
                  sizes="(min-width: 1024px) 33vw, 50vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </Container>
      ) : null}

      <Container width="narrow" className="mt-16">
        <div className="rounded-xl border border-border bg-surface p-8 text-center shadow-soft sm:p-10">
          <h2 className="font-heading text-2xl font-semibold text-navy">
            Want to make the next one happen?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            We receive donations by bank transfer and confirm every one by hand
            against our statement.
          </p>
          <Link
            href="/donate"
            className={`${buttonVariants({ variant: "donate", size: "lg" })} mt-7`}
          >
            Donate
          </Link>
        </div>
      </Container>
    </Section>
  );
}
