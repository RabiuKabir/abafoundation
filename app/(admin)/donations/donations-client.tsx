"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export type DonationRow = {
  id: string;
  donorName: string | null;
  donorEmail: string | null;
  amount: string;
  currency: string;
  method: "bank_transfer" | "cash";
  status: "pending" | "confirmed" | "rejected";
  reference: string | null;
  transferredAt: string | null;
  proofUrl: string | null;
  createdAt: string;
  confirmedByName: string | null;
};

const STATUS_VARIANT = {
  pending: "warning",
  confirmed: "success",
  rejected: "danger",
} as const;

export function DonationsClient({
  rows,
  confirmedTotal,
  filter,
}: {
  rows: DonationRow[];
  confirmedTotal: string;
  filter: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  async function decide(id: string, decision: "confirm" | "reject") {
    if (
      decision === "reject" &&
      !window.confirm("Reject this donation? The donor is emailed about it.")
    ) {
      return;
    }
    setBusy(id + decision);
    setError(null);
    setNotice(null);

    const res = await fetch(`/api/donations/${id}/confirm`, {
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
    setNotice(
      decision === "confirm"
        ? "Confirmed. It now counts towards totals, and the donor has been emailed."
        : "Rejected. Nothing counts towards totals."
    );
    router.refresh();
  }

  async function addOffline(formData: FormData) {
    setBusy("offline");
    setError(null);
    setFieldErrors({});
    const res = await fetch("/api/donations/offline", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        donorName: String(formData.get("donorName") ?? ""),
        donorEmail: String(formData.get("donorEmail") ?? ""),
        amount: String(formData.get("amount") ?? ""),
        method: String(formData.get("method") ?? "bank_transfer"),
        reference: String(formData.get("reference") ?? "") || null,
        transferredAt: String(formData.get("transferredAt") ?? "") || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      if (data.fields) setFieldErrors(data.fields);
      setError(data.error ?? "Could not record that donation.");
      return;
    }
    setAddOpen(false);
    setNotice("Recorded and confirmed, attributed to you.");
    router.refresh();
  }

  const filters = [
    { key: "", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "confirmed", label: "Confirmed" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <div className="mt-8 grid gap-6">
      <Card size="sm" className="max-w-sm">
        <CardContent>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Confirmed total
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-navy">
            {formatMoney(confirmedTotal)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Confirmed donations only — pending and rejected are excluded.
          </p>
        </CardContent>
      </Card>

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

      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <a
              key={f.key}
              href={f.key ? `/donations?status=${f.key}` : "/donations"}
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
        <Button variant="outline" onClick={() => setAddOpen((v) => !v)}>
          + Add donation
        </Button>
      </div>

      {addOpen ? (
        <Card>
          <CardContent>
            <CardTitle className="text-lg">Record a donation you&apos;ve seen</CardTitle>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              For cash in hand, or a transfer on the statement with no matching
              note. This is recorded as confirmed and attributed to you, so only
              enter what you have actually verified.
            </p>
            <form action={addOffline} className="mt-6 grid gap-5 sm:grid-cols-2">
              <Field label="Donor name" htmlFor="donorName" error={fieldErrors.donorName}>
                <Input id="donorName" name="donorName" placeholder="Anonymous" />
              </Field>
              <Field label="Donor email" htmlFor="donorEmail" error={fieldErrors.donorEmail}>
                <Input id="donorEmail" name="donorEmail" type="email" />
              </Field>
              <Field label="Amount" htmlFor="amount" required error={fieldErrors.amount}>
                <Input id="amount" name="amount" inputMode="decimal" required />
              </Field>
              <Field label="Method" htmlFor="method">
                <Select name="method" defaultValue="bank_transfer">
                  <SelectTrigger id="method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Reference" htmlFor="reference" error={fieldErrors.reference}>
                <Input id="reference" name="reference" />
              </Field>
              <Field label="Date received" htmlFor="transferredAt">
                <Input id="transferredAt" name="transferredAt" type="date" />
              </Field>
              <div className="flex gap-3 sm:col-span-2">
                <Button type="submit" disabled={busy === "offline"}>
                  {busy === "offline" ? "Recording…" : "Record donation"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          title="Nothing here"
          description="Pledges from the Donate page arrive as pending and wait for you to check them against the bank statement."
        />
      ) : (
        <Card className="overflow-x-auto">
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Donor</th>
                  <th className="pb-3 font-medium text-muted-foreground">Amount</th>
                  <th className="pb-3 font-medium text-muted-foreground">Reference</th>
                  <th className="pb-3 font-medium text-muted-foreground">Status</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => (
                  <tr key={d.id} className="border-b border-border/60 last:border-0">
                    <td className="py-4">
                      <div className="font-medium text-navy">
                        {d.donorName ?? "Anonymous"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {d.donorEmail ?? "no email"} ·{" "}
                        {d.method === "cash" ? "cash" : "transfer"}
                      </div>
                    </td>
                    <td className="py-4 font-medium tabular-nums text-navy">
                      {formatMoney(d.amount, d.currency)}
                    </td>
                    <td className="py-4 text-muted-foreground">
                      {d.reference || "—"}
                      {d.proofUrl ? (
                        <a
                          href={d.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-teal underline"
                        >
                          proof
                        </a>
                      ) : null}
                    </td>
                    <td className="py-4">
                      <Badge variant={STATUS_VARIANT[d.status]}>{d.status}</Badge>
                      {d.confirmedByName ? (
                        <div className="mt-1 text-xs text-muted-foreground">
                          by {d.confirmedByName}
                        </div>
                      ) : null}
                    </td>
                    <td className="py-4 text-right">
                      {d.status === "pending" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy !== null}
                            onClick={() => decide(d.id, "reject")}
                          >
                            {busy === d.id + "reject" ? "…" : "Reject"}
                          </Button>
                          <Button
                            size="sm"
                            disabled={busy !== null}
                            onClick={() => decide(d.id, "confirm")}
                          >
                            {busy === d.id + "confirm" ? "…" : "Confirm"}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
