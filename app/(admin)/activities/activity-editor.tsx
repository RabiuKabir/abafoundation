"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge, type ActivityStatus } from "@/components/admin/status-badge";
import { CoverPicker } from "./cover-picker";

export type EditorActivity = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  categoryId: string;
  coverMediaId: string | null;
  coverUrl: string | null;
  coverAlt: string | null;
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  status: ActivityStatus;
};

export function ActivityEditor({
  activity,
  categories,
  canPublish,
}: {
  activity: EditorActivity | null;
  categories: { id: string; name: string }[];
  canPublish: boolean;
}) {
  const router = useRouter();
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [seoOpen, setSeoOpen] = React.useState(false);
  const [cover, setCover] = React.useState<{ id: string; url: string; alt: string } | null>(
    activity?.coverMediaId && activity.coverUrl
      ? { id: activity.coverMediaId, url: activity.coverUrl, alt: activity.coverAlt ?? "" }
      : null
  );

  const status = activity?.status ?? "draft";
  const locked = status === "published" && !canPublish;

  function readForm(form: HTMLFormElement) {
    const fd = new FormData(form);
    return {
      title: String(fd.get("title") ?? ""),
      categoryId: String(fd.get("categoryId") ?? ""),
      summary: String(fd.get("summary") ?? ""),
      body: String(fd.get("body") ?? ""),
      coverMediaId: cover?.id ?? null,
      publishedAt: String(fd.get("publishedAt") ?? "") || null,
      seoTitle: String(fd.get("seoTitle") ?? "") || null,
      seoDescription: String(fd.get("seoDescription") ?? "") || null,
    };
  }

  async function save(form: HTMLFormElement): Promise<string | null> {
    setErrors({});
    setFormError(null);
    const body = readForm(form);
    const res = await fetch(
      activity ? `/api/activities/${activity.id}` : "/api/activities",
      {
        method: activity ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (data.fields) setErrors(data.fields);
      setFormError(data.error ?? "Could not save.");
      return null;
    }
    return activity ? activity.id : data.activity.id;
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy("save");
    const id = await save(e.currentTarget);
    setBusy(null);
    if (!id) return;
    setNotice("Saved.");
    if (!activity) router.replace(`/activities/${id}`);
    else router.refresh();
  }

  async function transition(
    form: HTMLFormElement,
    path: string,
    payload: object,
    label: string
  ) {
    setBusy(label);
    const id = await save(form);
    if (!id) {
      setBusy(null);
      return;
    }
    const res = await fetch(`/api/activities/${id}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setFormError(data.error ?? "Could not update the status.");
      return;
    }
    setNotice(
      data.status === "in_review"
        ? "Submitted for review. An Admin will look at it."
        : "Published — it's live on the public site."
    );
    if (!activity) router.replace(`/activities/${id}`);
    else router.refresh();
  }

  return (
    <form
      onSubmit={onSave}
      className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
    >
      <div className="grid gap-6">
        {formError ? (
          <p
            role="alert"
            className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            {formError}
          </p>
        ) : null}
        {notice ? (
          <p className="rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
            {notice}
          </p>
        ) : null}

        <Card>
          <CardContent className="grid gap-5">
            <Field label="Title" htmlFor="title" required error={errors.title}>
              <Input
                id="title"
                name="title"
                defaultValue={activity?.title ?? ""}
                required
                disabled={locked}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Category"
                htmlFor="categoryId"
                required
                error={errors.categoryId}
              >
                <Select
                  name="categoryId"
                  defaultValue={activity?.categoryId ?? categories[0]?.id}
                  disabled={locked}
                >
                  <SelectTrigger id="categoryId">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field
                label="Date"
                htmlFor="publishedAt"
                hint="When this happened. Leave blank to use the publish date."
                error={errors.publishedAt}
              >
                <Input
                  id="publishedAt"
                  name="publishedAt"
                  type="date"
                  defaultValue={activity?.publishedAt?.slice(0, 10) ?? ""}
                  disabled={locked}
                />
              </Field>
            </div>

            <Field
              label="Summary"
              htmlFor="summary"
              required
              hint="One or two sentences — this is what appears on the cards."
              error={errors.summary}
            >
              <Textarea
                id="summary"
                name="summary"
                rows={3}
                defaultValue={activity?.summary ?? ""}
                required
                disabled={locked}
              />
            </Field>

            <Field label="Story" htmlFor="body" required error={errors.body}>
              <Textarea
                id="body"
                name="body"
                rows={16}
                defaultValue={activity?.body ?? ""}
                required
                disabled={locked}
                className="min-h-80 leading-relaxed"
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <button
              type="button"
              onClick={() => setSeoOpen((v) => !v)}
              aria-expanded={seoOpen}
              className="flex w-full items-center justify-between text-left"
            >
              <CardTitle className="text-base">Search engine listing</CardTitle>
              <span className="text-sm text-muted-foreground">
                {seoOpen ? "Hide" : "Show"}
              </span>
            </button>
            {seoOpen ? (
              <div className="mt-6 grid gap-5">
                <Field
                  label="SEO title"
                  htmlFor="seoTitle"
                  hint="Leave blank to use the activity title."
                  error={errors.seoTitle}
                >
                  <Input
                    id="seoTitle"
                    name="seoTitle"
                    defaultValue={activity?.seoTitle ?? ""}
                    disabled={locked}
                  />
                </Field>
                <Field
                  label="Meta description"
                  htmlFor="seoDescription"
                  hint="Around 150 characters. Falls back to the summary."
                  error={errors.seoDescription}
                >
                  <Textarea
                    id="seoDescription"
                    name="seoDescription"
                    rows={3}
                    defaultValue={activity?.seoDescription ?? ""}
                    disabled={locked}
                  />
                </Field>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid content-start gap-6">
        <Card size="sm">
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <StatusBadge status={status} />
            </div>

            {locked ? (
              <p className="text-xs leading-relaxed text-muted-foreground">
                This is published, so it&apos;s read-only for you. Ask an Admin
                to return it to draft if it needs changing.
              </p>
            ) : (
              <div className="grid gap-2">
                <Button type="submit" variant="outline" disabled={busy !== null}>
                  {busy === "save" ? "Saving…" : "Save draft"}
                </Button>

                {status === "draft" ? (
                  <Button
                    type="button"
                    disabled={busy !== null}
                    onClick={(e) =>
                      transition(
                        e.currentTarget.form as HTMLFormElement,
                        "/submit",
                        {},
                        "submit"
                      )
                    }
                  >
                    {busy === "submit" ? "Submitting…" : "Submit for review"}
                  </Button>
                ) : null}

                {canPublish && status !== "published" ? (
                  <Button
                    type="button"
                    disabled={busy !== null}
                    onClick={(e) =>
                      transition(
                        e.currentTarget.form as HTMLFormElement,
                        "/publish",
                        { decision: "publish" },
                        "publish"
                      )
                    }
                  >
                    {busy === "publish" ? "Publishing…" : "Approve & publish"}
                  </Button>
                ) : null}
              </div>
            )}

            {!canPublish ? (
              <p className="text-xs leading-relaxed text-muted-foreground">
                Editors submit; an Admin publishes. Nothing you write appears on
                the public site until it&apos;s approved.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <CoverPicker value={cover} onChange={setCover} disabled={locked} />
      </div>
    </form>
  );
}
