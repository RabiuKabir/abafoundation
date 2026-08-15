"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function PledgeForm() {
  const router = useRouter();
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setFormError(null);

    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/donations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        donorName: String(fd.get("donorName") ?? ""),
        donorEmail: String(fd.get("donorEmail") ?? ""),
        amount: String(fd.get("amount") ?? ""),
        transferredAt: String(fd.get("transferredAt") ?? "") || null,
        reference: String(fd.get("reference") ?? "") || null,
        consentContact: fd.get("consentContact") === "on",
        website: String(fd.get("website") ?? ""),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      if (data.fields) setErrors(data.fields);
      setFormError(data.error ?? "Could not record that. Please try again.");
      return;
    }
    router.push(
      data.reference ? `/donate/thanks?ref=${encodeURIComponent(data.reference)}` : "/donate/thanks"
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

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" htmlFor="donorName" required error={errors.donorName}>
          <Input id="donorName" name="donorName" autoComplete="name" required />
        </Field>
        <Field label="Email" htmlFor="donorEmail" required error={errors.donorEmail}>
          <Input
            id="donorEmail"
            name="donorEmail"
            type="email"
            autoComplete="email"
            required
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Amount sent"
          htmlFor="amount"
          required
          hint="In naira, e.g. 25000"
          error={errors.amount}
        >
          <Input id="amount" name="amount" inputMode="decimal" required />
        </Field>
        <Field
          label="Date of transfer"
          htmlFor="transferredAt"
          error={errors.transferredAt}
        >
          <Input id="transferredAt" name="transferredAt" type="date" />
        </Field>
      </div>

      <Field
        label="Reference you quoted"
        htmlFor="reference"
        hint="Whatever you typed as the narration — it helps us find your transfer."
        error={errors.reference}
      >
        <Input id="reference" name="reference" />
      </Field>

      <label className="flex items-start gap-3 text-sm text-ink/75">
        <input
          type="checkbox"
          name="consentContact"
          className="mt-0.5 size-4 rounded border-border text-navy focus-visible:ring-3 focus-visible:ring-ring/40"
        />
        <span>
          Keep me updated about the work. We won&apos;t pass your details to
          anyone else.
        </span>
      </label>

      {/* Honeypot — off-screen and out of the tab order. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Leave this empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Button type="submit" disabled={busy} className="mt-2 justify-self-start">
        {busy ? "Sending…" : "Tell us about my transfer"}
      </Button>

      <p className="text-xs leading-relaxed text-muted-foreground">
        This form doesn&apos;t take money and isn&apos;t a payment page — it
        just tells us to look for your transfer. Nothing is counted until a
        person has matched it against our bank statement.
      </p>
    </form>
  );
}
