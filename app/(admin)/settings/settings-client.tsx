"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Org = {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
};
type Bank = {
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  referenceHint?: string;
  demo?: boolean;
};
type Category = { id: string; name: string; slug: string; used: number };

export function SettingsClient({
  org,
  bank,
  categories,
}: {
  org: Org;
  bank: Bank;
  categories: Category[];
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [orgErrors, setOrgErrors] = React.useState<Record<string, string>>({});
  const [bankErrors, setBankErrors] = React.useState<Record<string, string>>({});

  async function save(group: "org" | "bank_details", value: object, label: string) {
    setBusy(group);
    setNotice(null);
    setError(null);
    setOrgErrors({});
    setBankErrors({});

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ group, value }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);

    if (!res.ok) {
      if (data.fields) {
        (group === "org" ? setOrgErrors : setBankErrors)(data.fields);
      }
      setError(data.error ?? "Could not save.");
      return;
    }
    setNotice(`${label} saved.`);
    router.refresh();
  }

  async function addCategory(formData: FormData) {
    setBusy("category");
    setError(null);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: String(formData.get("name") ?? "") }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setError(data.error ?? "Could not add that category.");
      return;
    }
    setNotice("Category added.");
    router.refresh();
  }

  async function removeCategory(id: string, name: string) {
    if (!window.confirm(`Remove the "${name}" category?`)) return;
    setBusy(id);
    setError(null);
    const res = await fetch(`/api/categories?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setError(data.error ?? "Could not remove that category.");
      return;
    }
    setNotice("Category removed.");
    router.refresh();
  }

  return (
    <div className="mt-8 grid gap-6">
      {notice ? (
        <p className="rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {error}
        </p>
      ) : null}

      {/* ---------------------------------------------------- bank details */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-lg">
              Bank details shown on the Donate page
            </CardTitle>
            {bank.demo ? (
              <Badge variant="warning">placeholders — not live</Badge>
            ) : (
              <Badge variant="success">live</Badge>
            )}
          </div>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Donors copy these straight into their banking app. Check every digit
            against a statement before saving — a wrong character sends
            somebody&apos;s donation to a stranger.
          </p>

          <form
            action={(fd) =>
              save(
                "bank_details",
                {
                  accountName: String(fd.get("accountName") ?? ""),
                  accountNumber: String(fd.get("accountNumber") ?? ""),
                  bankName: String(fd.get("bankName") ?? ""),
                  referenceHint: String(fd.get("referenceHint") ?? ""),
                },
                "Bank details"
              )
            }
            className="mt-6 grid gap-5 sm:grid-cols-2"
          >
            <Field
              label="Account name"
              htmlFor="accountName"
              required
              error={bankErrors.accountName}
            >
              <Input
                id="accountName"
                name="accountName"
                defaultValue={bank.accountName ?? ""}
                required
              />
            </Field>
            <Field
              label="Account number"
              htmlFor="accountNumber"
              required
              hint="Digits only."
              error={bankErrors.accountNumber}
            >
              <Input
                id="accountNumber"
                name="accountNumber"
                inputMode="numeric"
                defaultValue={bank.accountNumber ?? ""}
                required
                className="tabular-nums"
              />
            </Field>
            <Field
              label="Bank"
              htmlFor="bankName"
              required
              error={bankErrors.bankName}
            >
              <Input
                id="bankName"
                name="bankName"
                defaultValue={bank.bankName ?? ""}
                required
              />
            </Field>
            <Field
              label="What donors should quote"
              htmlFor="referenceHint"
              required
              error={bankErrors.referenceHint}
            >
              <Input
                id="referenceHint"
                name="referenceHint"
                defaultValue={bank.referenceHint ?? ""}
                required
              />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={busy === "bank_details"}>
                {busy === "bank_details" ? "Saving…" : "Save bank details"}
              </Button>
              {bank.demo ? (
                <p className="mt-3 text-xs text-warning">
                  Saving real details removes the warning banner from the public
                  Donate page.
                </p>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* -------------------------------------------------------- org */}
      <Card>
        <CardContent>
          <CardTitle className="text-lg">Organisation</CardTitle>
          <form
            action={(fd) =>
              save(
                "org",
                {
                  name: String(fd.get("name") ?? ""),
                  email: String(fd.get("email") ?? ""),
                  phone: String(fd.get("phone") ?? "") || null,
                  address: String(fd.get("address") ?? "") || null,
                },
                "Organisation details"
              )
            }
            className="mt-6 grid gap-5 sm:grid-cols-2"
          >
            <Field label="Name" htmlFor="name" required error={orgErrors.name}>
              <Input id="name" name="name" defaultValue={org.name ?? ""} required />
            </Field>
            <Field label="Email" htmlFor="orgEmail" required error={orgErrors.email}>
              <Input
                id="orgEmail"
                name="email"
                type="email"
                defaultValue={org.email ?? ""}
                required
              />
            </Field>
            <Field label="Phone" htmlFor="phone" error={orgErrors.phone}>
              <Input id="phone" name="phone" defaultValue={org.phone ?? ""} />
            </Field>
            <Field label="Address" htmlFor="address" error={orgErrors.address}>
              <Textarea
                id="address"
                name="address"
                rows={2}
                defaultValue={org.address ?? ""}
              />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={busy === "org"}>
                {busy === "org" ? "Saving…" : "Save organisation details"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* -------------------------------------------------- categories */}
      <Card>
        <CardContent>
          <CardTitle className="text-lg">Programme categories</CardTitle>
          <p className="mt-3 text-sm text-muted-foreground">
            These are the filters on the public Programs page. A category in use
            can&apos;t be removed until its activities are moved.
          </p>

          <ul className="mt-6 grid gap-2">
            {categories.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3"
              >
                <span className="text-sm font-medium text-navy">
                  {c.name}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {c.used} {c.used === 1 ? "activity" : "activities"}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy === c.id || c.used > 0}
                  onClick={() => removeCategory(c.id, c.name)}
                >
                  {busy === c.id ? "…" : "Remove"}
                </Button>
              </li>
            ))}
          </ul>

          <form action={addCategory} className="mt-6 flex flex-wrap items-end gap-3">
            <Field label="Add a category" htmlFor="categoryName" className="min-w-64">
              <Input id="categoryName" name="name" required />
            </Field>
            <Button type="submit" variant="outline" disabled={busy === "category"}>
              {busy === "category" ? "Adding…" : "Add"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
