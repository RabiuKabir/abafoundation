"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm() {
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setFormError(null);

    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: String(fd.get("name") ?? ""),
        email: String(fd.get("email") ?? ""),
        message: String(fd.get("message") ?? ""),
        website: String(fd.get("website") ?? ""),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      if (data.fields) setErrors(data.fields);
      setFormError(data.error ?? "Could not send that. Please try again.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-success/20 bg-success/10 px-6 py-8 text-center">
        <h2 className="font-heading text-xl font-semibold text-success">
          Thank you — it&apos;s with us.
        </h2>
        <p className="mt-2 text-sm text-ink/70">
          Someone will read this and reply. We answer everything, though not
          always the same day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      {formError ? (
        <p
          role="alert"
          className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {formError}
        </p>
      ) : null}

      <Field label="Your name" htmlFor="name" required error={errors.name}>
        <Input id="name" name="name" autoComplete="name" required />
      </Field>

      <Field label="Email" htmlFor="email" required error={errors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>

      <Field label="Message" htmlFor="message" required error={errors.message}>
        <Textarea id="message" name="message" rows={6} required />
      </Field>

      {/* Honeypot — hidden from people, irresistible to bots. Not display:none,
          which some bots detect; off-screen and removed from the tab order. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Leave this empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Button type="submit" disabled={busy} className="mt-2 justify-self-start">
        {busy ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
