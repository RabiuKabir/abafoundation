import { requirePermission, toResponse } from "@/lib/session";
import { getReportRows, type ReportFilters } from "@/lib/reports";
import { csvResponse, toCsv } from "@/lib/csv";
import { writeAudit } from "@/lib/audit";

/**
 * CSV export — Admin only.
 *
 * Exporting is itself a sensitive action: it takes donor names, emails and
 * amounts out of the system and onto somebody's laptop. So it is audited with
 * the filters used and the number of rows that left.
 */
export async function GET(request: Request) {
  try {
    const admin = await requirePermission("reports.read");
    const params = new URL(request.url).searchParams;

    const statusParam = params.get("status");
    const status =
      statusParam === "pending" ||
      statusParam === "confirmed" ||
      statusParam === "rejected"
        ? statusParam
        : null;

    const filters: ReportFilters = {
      from: params.get("from"),
      to: params.get("to"),
      categorySlug: params.get("category"),
      status,
    };

    const rows = await getReportRows(filters);

    const csv = toCsv(
      [
        "Receipt no",
        "Created",
        "Transferred",
        "Confirmed",
        "Donor",
        "Email",
        "Amount",
        "Currency",
        "Method",
        "Status",
        "Donor reference",
        "Category",
        "Activity",
        "Confirmed by",
      ],
      rows.map((r) => [
        r.receiptNo,
        r.createdAt.toISOString(),
        r.transferredAt?.toISOString() ?? "",
        r.confirmedAt?.toISOString() ?? "",
        r.donorName,
        r.donorEmail,
        r.amount,
        r.currency,
        r.method,
        r.status,
        r.reference,
        r.category,
        r.activityTitle,
        r.confirmedBy,
      ])
    );

    await writeAudit({
      userId: admin.id,
      action: "report.export",
      entity: "report",
      meta: { filters, rows: rows.length },
    });

    const stamp = new Date().toISOString().slice(0, 10);
    return csvResponse(`aba-donations-${filters.status ?? "confirmed"}-${stamp}.csv`, csv);
  } catch (error) {
    return toResponse(error);
  }
}
