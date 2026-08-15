import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Dashboard" };

/**
 * Dashboard — Phase 0 placeholder shell.
 * The KPI row and recent-donations table are wired in Phase 4. Totals will
 * count confirmed donations only.
 */
const kpis = [
  { label: "Confirmed raised (30d)", hint: "Confirmed donations only" },
  { label: "Pending pledges", hint: "Awaiting an Admin check" },
  { label: "Awaiting review", hint: "Drafts submitted by Editors" },
  { label: "New messages", hint: "From the contact form" },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            An overview of giving, content and messages.
          </p>
        </div>
        <Badge variant="info">Phase 0 — shell only</Badge>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} size="sm">
            <CardContent>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {kpi.label}
              </p>
              <p className="mt-3 font-heading text-3xl font-semibold text-navy">
                —
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{kpi.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardContent>
          <CardTitle className="text-lg">Recent donations</CardTitle>
          <EmptyState
            className="mt-6"
            title="No donations yet"
            description="Pledges from the public Donate page will land here as pending, and stay pending until an Admin confirms them against the bank statement."
          />
        </CardContent>
      </Card>
    </div>
  );
}
