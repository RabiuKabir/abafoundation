"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type MessageRow = {
  id: string;
  name: string;
  email: string;
  message: string;
  status: "new" | "handled";
  createdAt: string;
};

export function MessagesClient({
  rows,
  filter,
}: {
  rows: MessageRow[];
  filter: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function setStatus(id: string, status: "new" | "handled") {
    setBusy(id);
    setError(null);
    const res = await fetch(`/api/messages/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setError(data.error ?? "Could not update that message.");
      return;
    }
    router.refresh();
  }

  const filters = [
    { key: "", label: "All" },
    { key: "new", label: "New" },
    { key: "handled", label: "Handled" },
  ];

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

      <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <a
            key={f.key}
            href={f.key ? `/messages?status=${f.key}` : "/messages"}
            aria-current={filter === f.key ? "page" : undefined}
            className={cn(
              "rounded-pill border px-3.5 py-1.5 text-sm font-medium transition-colors",
              filter === f.key
                ? "border-navy bg-navy text-primary-foreground"
                : "border-border bg-surface text-ink/70 hover:border-teal hover:text-teal"
            )}
          >
            {f.label}
          </a>
        ))}
      </nav>

      {rows.map((m) => (
        <Card key={m.id}>
          <CardContent>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-navy">{m.name}</span>
                  <Badge variant={m.status === "new" ? "warning" : "success"}>
                    {m.status}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  <a href={`mailto:${m.email}`} className="text-teal hover:underline">
                    {m.email}
                  </a>{" "}
                  ·{" "}
                  {new Date(m.createdAt).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div className="flex gap-2">
                <a
                  href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your message to ABA Foundation")}`}
                  className="inline-flex h-9 items-center rounded-button border border-border bg-surface px-4 text-[0.8125rem] font-medium text-navy transition-colors hover:border-teal hover:text-teal"
                >
                  Reply
                </a>
                <Button
                  size="sm"
                  variant={m.status === "new" ? "primary" : "outline"}
                  disabled={busy === m.id}
                  onClick={() => setStatus(m.id, m.status === "new" ? "handled" : "new")}
                >
                  {busy === m.id
                    ? "…"
                    : m.status === "new"
                      ? "Mark handled"
                      : "Reopen"}
                </Button>
              </div>
            </div>

            <p className="mt-4 border-t border-border pt-4 text-sm leading-relaxed whitespace-pre-wrap text-ink/80">
              {m.message}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
