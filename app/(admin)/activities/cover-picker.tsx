"use client";

import * as React from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export type Cover = { id: string; url: string; alt: string };

const MAX_MB = 5;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Cover image + alt text. Alt text is required before the upload is allowed —
 * the only reliable moment to get it is while the person is looking at the
 * picture. The server enforces the same rule (lib/validation.ts mediaSchema);
 * these checks just fail faster and more kindly.
 */
export function CoverPicker({
  value,
  onChange,
  disabled,
}: {
  value: Cover | null;
  onChange: (cover: Cover | null) => void;
  disabled?: boolean;
}) {
  const [alt, setAlt] = React.useState(value?.alt ?? "");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setError(null);

    if (!ACCEPTED.includes(file.type)) {
      setError("Use a JPEG, PNG, WebP or AVIF image.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`That image is ${(file.size / 1024 / 1024).toFixed(1)}MB — the limit is ${MAX_MB}MB.`);
      return;
    }
    if (alt.trim().length < 4) {
      setError("Describe the image first — it's required.");
      return;
    }

    setBusy(true);
    const body = new FormData();
    body.append("file", file);
    body.append("altText", alt.trim());

    const res = await fetch("/api/media", { method: "POST", body });
    const data = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      setError(data.error ?? "Upload failed.");
      return;
    }
    onChange({ id: data.media.id, url: data.media.url, alt: alt.trim() });
  }

  return (
    <Card size="sm">
      <CardContent className="grid gap-4">
        <CardTitle className="text-base">Cover image</CardTitle>

        {value ? (
          <div className="relative aspect-[3/2] overflow-hidden rounded-md border border-border">
            <Image
              src={value.url}
              alt={value.alt}
              fill
              sizes="320px"
              className="object-cover"
            />
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-border px-4 py-8 text-center text-xs text-muted-foreground">
            No cover yet. Cards and the story page look thin without one.
          </p>
        )}

        <Field
          label="Alt text"
          htmlFor="coverAlt"
          required
          hint="What's happening in the picture? Read aloud to people who can't see it."
        >
          <Input
            id="coverAlt"
            value={alt}
            disabled={disabled}
            onChange={(e) => setAlt(e.target.value)}
          />
        </Field>

        {error ? (
          <p role="alert" className="text-xs font-medium text-danger">
            {error}
          </p>
        ) : null}

        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = "";
          }}
        />

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || busy}
            onClick={() => fileRef.current?.click()}
          >
            {busy ? "Uploading…" : value ? "Replace" : "Upload image"}
          </Button>
          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || busy}
              onClick={() => onChange(null)}
            >
              Remove
            </Button>
          ) : null}
        </div>

        <p className="text-xs text-muted-foreground">
          JPEG, PNG, WebP or AVIF · up to {MAX_MB}MB.
        </p>
      </CardContent>
    </Card>
  );
}
