import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { donations } from "@/db/schema";
import { HttpError, requirePermission, toResponse } from "@/lib/session";
import { donationDecisionSchema, fieldErrors } from "@/lib/validation";
import { writeAudit } from "@/lib/audit";
import { sendMail } from "@/lib/mail";
import { formatMoney } from "@/lib/money";
import { referenceFor } from "@/lib/settings";

/**
 * The human confirmation step — HARD RULE 1.
 *
 * This is the ONLY route in the codebase that can move a donation out of
 * `pending`, and it requires `donations.confirm`, which lib/rbac.ts grants to
 * admin and nobody else. An Admin should have the bank statement open when
 * they use it.
 *
 * Every decision writes to the audit log, and it is recorded WHO decided —
 * donations.confirmed_by_id is ON DELETE RESTRICT so that attribution can
 * never be erased.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requirePermission("donations.confirm");
    const { id } = await params;

    const parsed = donationDecisionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input.", fields: fieldErrors(parsed.error) },
        { status: 422 }
      );
    }
    const { decision, note } = parsed.data;

    const [row] = await db
      .select({
        id: donations.id,
        status: donations.status,
        amount: donations.amount,
        currency: donations.currency,
        donorName: donations.donorName,
        donorEmail: donations.donorEmail,
      })
      .from(donations)
      .where(eq(donations.id, id))
      .limit(1);

    if (!row) throw new HttpError(404, "No such donation.");

    // Only a pending donation is awaiting a decision. Re-deciding a settled
    // one would quietly rewrite the ledger.
    if (row.status !== "pending") {
      throw new HttpError(
        409,
        `That donation is already ${row.status}. Nothing to decide.`
      );
    }

    const status = decision === "confirm" ? "confirmed" : "rejected";

    await db
      .update(donations)
      .set({
        status,
        confirmedById: admin.id,
        confirmedAt: new Date(),
        receiptNo: decision === "confirm" ? referenceFor(row.id) : null,
      })
      .where(eq(donations.id, id));

    await writeAudit({
      userId: admin.id,
      action: decision === "confirm" ? "donation.confirm" : "donation.reject",
      entity: "donation",
      entityId: row.id,
      meta: {
        amount: row.amount,
        currency: row.currency,
        previousStatus: row.status,
        newStatus: status,
        note: note ?? null,
      },
    });

    if (row.donorEmail) {
      await sendMail({
        to: row.donorEmail,
        subject:
          decision === "confirm"
            ? "Your donation is confirmed — thank you"
            : "About the transfer you told us about",
        text:
          decision === "confirm"
            ? [
                `Dear ${row.donorName ?? "friend"},`,
                "",
                `We've matched your transfer of ${formatMoney(row.amount, row.currency)} against our bank statement.`,
                `It is confirmed. Your receipt number is ${referenceFor(row.id)}.`,
                "",
                "Thank you — this goes straight into the programmes.",
                "",
                "ABA Foundation",
              ].join("\n")
            : [
                `Dear ${row.donorName ?? "friend"},`,
                "",
                "We couldn't match the transfer you told us about against our bank",
                "statement, so we haven't been able to confirm it.",
                note ? `\nNote from our team: ${note}` : "",
                "",
                "This is usually a reference that didn't come through, or a transfer",
                "still in transit. Please reply to this email and we'll look again.",
                "",
                "ABA Foundation",
              ]
                .filter(Boolean)
                .join("\n"),
      });
    }

    return Response.json({ ok: true, status });
  } catch (error) {
    return toResponse(error);
  }
}
