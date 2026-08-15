import Image from "next/image";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PublicActivity } from "@/lib/activities";

/** One card definition, used on Home and Programs. Never restyled per page. */
export function ActivityCard({ activity }: { activity: PublicActivity }) {
  const date = activity.publishedAt
    ? new Date(activity.publishedAt).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <Card
      className={cn(
        "transition-shadow hover:shadow-lift",
        // No cover? Don't leave an empty grey rectangle — that's the classic
        // unfinished look. Fall back to a text-only card that reads as a
        // deliberate choice.
        activity.coverUrl && "gap-0 pt-0"
      )}
    >
      {activity.coverUrl ? (
        <div className="relative aspect-[3/2]">
          <Image
            src={activity.coverUrl}
            alt={activity.coverAlt ?? ""}
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}
      <CardContent className={activity.coverUrl ? "pt-6" : undefined}>
        <p className="text-xs font-medium tracking-wide text-teal uppercase">
          {activity.categoryName}
          {date ? <span className="text-muted-foreground"> · {date}</span> : null}
        </p>
        <CardTitle className="mt-2">
          <Link
            href={`/programs/${activity.slug}`}
            className="rounded-sm after:absolute after:inset-0 hover:text-teal"
          >
            {activity.title}
          </Link>
        </CardTitle>
        <CardDescription className="mt-3">{activity.summary}</CardDescription>
      </CardContent>
    </Card>
  );
}
