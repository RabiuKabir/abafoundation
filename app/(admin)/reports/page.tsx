import { PageHeader } from "@/components/admin/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { listAllCategories } from "@/lib/activities";
import { formatMoney } from "@/lib/money";
import { getReport } from "@/lib/reports";
import { requirePageAccess } from "@/lib/session";

export const metadata = { title: "Reports" };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    category?: string;
    status?: string;
  }>;
}) {
  await requirePageAccess("reports.read");
  const sp = await searchParams;

  const status =
    sp.status === "pending" || sp.status === "rejected" || sp.status === "confirmed"
      ? sp.status
      : "confirmed";

  const filters = {
    from: sp.from || null,
    to: sp.to || null,
    categorySlug: sp.category || null,
    status,
  } as const;

  const [{ summary, byCategory }, categories] = await Promise.all([
    getReport(filters),
    listAllCategories(),
  ]);

  const exportHref = `/api/reports/export?${new URLSearchParams(
    Object.entries({
      from: filters.from ?? "",
      to: filters.to ?? "",
      category: filters.categorySlug ?? "",
      status,
    }).filter(([, v]) => v) as [string, string][]
  ).toString()}`;

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <PageHeader
        title="Donation report"
        description="Confirmed donations by default — the figure that a bank statement stands behind."
        action={
          <a href={exportHref} className={buttonVariants()} download>
            Export CSV
          </a>
        }
      />

      {/* A plain GET form: the filters live in the URL, so a report can be
          bookmarked or pasted to a colleague and shows them the same thing. */}
      <Card className="mt-8">
        <CardContent>
          <form method="get" className="grid gap-5 sm:grid-cols-4">
            <Field label="From" htmlFor="from">
              <Input id="from" name="from" type="date" defaultValue={sp.from ?? ""} />
            </Field>
            <Field label="To" htmlFor="to">
              <Input id="to" name="to" type="date" defaultValue={sp.to ?? ""} />
            </Field>
            <Field label="Category" htmlFor="category">
              <select
                id="category"
                name="category"
                defaultValue={sp.category ?? ""}
                className="h-11 w-full rounded-lg border border-input bg-surface px-3.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status" htmlFor="status">
              <select
                id="status"
                name="status"
                defaultValue={status}
                className="h-11 w-full rounded-lg border border-input bg-surface px-3.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </Field>
            <div className="sm:col-span-4">
              <button type="submit" className={buttonVariants({ variant: "outline" })}>
                Apply filters
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {status !== "confirmed" ? (
        <p className="mt-6 rounded-lg border border-warning/25 bg-warning/10 px-4 py-3 text-sm text-warning">
          Showing <strong>{status}</strong> donations. These are not money the
          foundation has received — only confirmed donations count.
        </p>
      ) : null}

      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        <Card size="sm">
          <CardContent>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Total
            </p>
            <p className="mt-3 text-3xl font-semibold tabular-nums text-navy">
              {formatMoney(summary?.total)}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Donations
            </p>
            <p className="mt-3 text-3xl font-semibold tabular-nums text-navy">
              {summary?.count ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Average
            </p>
            <p className="mt-3 text-3xl font-semibold tabular-nums text-navy">
              {formatMoney(summary?.average)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardContent>
          <CardTitle className="text-lg">By category</CardTitle>
          {byCategory.length === 0 ? (
            <EmptyState
              className="mt-6"
              title="Nothing in this range"
              description="Try widening the dates, or clearing the category filter."
            />
          ) : (
            <table className="mt-6 w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Category</th>
                  <th className="pb-3 font-medium text-muted-foreground">Count</th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {byCategory.map((r) => (
                  <tr key={r.category} className="border-b border-border/60 last:border-0">
                    <td className="py-3 text-navy">{r.category}</td>
                    <td className="py-3 tabular-nums text-muted-foreground">
                      {r.count}
                    </td>
                    <td className="py-3 text-right font-medium tabular-nums text-navy">
                      {formatMoney(r.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
