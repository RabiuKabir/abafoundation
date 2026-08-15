import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { requirePageAccess } from "@/lib/session";

export const metadata = { title: "Dashboard" };

const kpis = [
  { label: "Confirmed raised (30d)", hint: "Confirmed donations only" },
  { label: "Pending pledges", hint: "Awaiting an Admin check" },
  { label: "Awaiting review", hint: "Drafts submitted by Editors" },
  { label: "New messages", hint: "From the contact form" },
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const user = await requirePageAccess("activities.read.any");
  const { denied } = await searchParams;

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <PageHeader
        title={`Welcome, ${user.name.split(" ")[0]}`}
        description="An overview of giving, content and messages."
        action={<Badge variant="info">Signed in as {user.role}</Badge>}
      />

      {denied ? (
        <p
          role="alert"
          className="mt-6 rounded-lg border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning"
        >
          You don&apos;t have access to that section. If you think you should,
          ask an Admin.
        </p>
      ) : null}

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
