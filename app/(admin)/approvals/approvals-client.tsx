"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type Pending = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  categoryName: string;
  authorName: string;
  updatedAt: string;
};

export function ApprovalsClient({ items }: { items: Pending[] }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function decide(id: string, decision: "publish" | "return") {
    setBusy(id + decision);
    setError(null);
    const res = await fetch(`/api/activities/${id}/publish`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setError(data.error ?? "Could not record that decision.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-8 grid gap-5">
      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {error}
        </p>
      ) : null}

      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 max-w-2xl">
              <p className="text-xs text-muted-foreground">
                {item.categoryName} · submitted by {item.authorName} ·{" "}
                {new Date(item.updatedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
              <h2 className="mt-1 font-heading text-xl font-semibold text-navy">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.summary}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/activities/${item.id}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Read it
              </Link>
              <Button
                size="sm"
                variant="outline"
                disabled={busy !== null}
                onClick={() => decide(item.id, "return")}
              >
                {busy === item.id + "return" ? "…" : "Return to author"}
              </Button>
              <Button
                size="sm"
                disabled={busy !== null}
                onClick={() => decide(item.id, "publish")}
              >
                {busy === item.id + "publish" ? "…" : "Approve & publish"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
