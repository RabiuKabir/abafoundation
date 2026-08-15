import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { activities, donations, users } from "@/db/schema";
import { requirePermission, toResponse } from "@/lib/session";
import { fieldErrors, pledgeSchema } from "@/lib/validation";
import { clientIp, rateLimit, sweepExpired } from "@/lib/rate-limit";
import { writeAudit } from "@/lib/audit";
import { financeInbox, sendMail } from "@/lib/mail";
import { getBankDetails, referenceFor } from "@/lib/settings";
import { formatMoney } from "@/lib/money";

/**
 * POST — a donor telling us they have made a bank transfer.
 *
 * HARD RULE 1: this creates a `pending` row and nothing else. The public can
 * never mark money as received; only an Admin who has seen the bank statement
 * can, via /api/donations/[id]/confirm. There is deliberately no code path
 * here that writes any other status.
 *
 * Unauthenticated, so it carries the same protections as the contact form:
 * honeypot, rate limit, server-side validation.
 */
export async function POST(request: Request) {
  try {
    sweepExpired();
    const ip = clientIp(request);
    const { ok, retryAfterSeconds } = rateLimit({
      key: `pledge:${ip}`,
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });
    if (!ok) {
      return Response.json(
        { error: "Too many submissions just now. Please try again shortly." },
        { status: 429, headers: { "retry-after": String(retryAfterSeconds) } }
      );
    }

    const parsed = pledgeSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { error: "Please check the form.", fields: fieldErrors(parsed.error) },
        { status: 422 }
      );
    }
    const data = parsed.data;

    // Honeypot — answer 200 so a bot learns nothing from the difference.
    if (data.website) return Response.json({ ok: true, reference: null });

    if (data.activityId) {
      const [exists] = await db
        .select({ id: activities.id })
        .from(activities)
        .where(eq(activities.id, data.activityId))
        .limit(1);
      if (!exists) data.activityId = null;
    }

    const [created] = await db
      .insert(donations)
      .values({
        donorName: data.donorName,
        donorEmail: data.donorEmail,
        amount: data.amount,
        method: "bank_transfer",
        reference: data.reference ?? null,
        transferredAt: data.transferredAt ?? null,
        proofUrl: data.proofUrl ?? null,
        activityId: data.activityId ?? null,
        consentContact: data.consentContact,
        // status is omitted on purpose — the column defaults to 'pending'.
      })
      .returning({ id: donations.id, amount: donations.amount });

    const reference = referenceFor(created.id);
    const bank = await getBankDetails();

    await writeAudit({
      userId: null,
      action: "donation.create.public",
      entity: "donation",
      entityId: created.id,
      meta: { amount: created.amount, reference, ip },
    });

    // Acknowledgement — carefully worded as *pending*, never "received".
    await sendMail({
      to: data.donorEmail,
      subject: "We've got your note — pending confirmation",
      text: [
        `Dear ${data.donorName},`,
        "",
        `Thank you for telling us about your transfer of ${formatMoney(created.amount)}.`,
        "",
        "This is NOT yet a receipt. We check every transfer against our bank",
        "statement by hand, and we'll email you again once we've matched it.",
        "That usually takes a couple of working days.",
        "",
        `Your reference: ${reference}`,
        bank && !bank.demo
          ? `If you haven't sent it yet, our account is ${bank.accountName}, ${bank.accountNumber} at ${bank.bankName}.`
          : "",
        "",
        "With thanks,",
        "ABA Foundation",
      ]
        .filter(Boolean)
        .join("\n"),
    });

    const finance = financeInbox();
    if (finance) {
      await sendMail({
        to: finance,
        subject: `Pledge to confirm: ${formatMoney(created.amount)} (${reference})`,
        text: [
          "Someone has reported a bank transfer. It is pending until confirmed.",
          "",
          `Donor:     ${data.donorName} <${data.donorEmail}>`,
          `Amount:    ${formatMoney(created.amount)}`,
          `Reference: ${data.reference || "(none quoted)"}`,
          `Our ref:   ${reference}`,
          `Sent on:   ${data.transferredAt?.toDateString() ?? "not stated"}`,
          "",
          "Check the statement, then confirm or reject it in the admin.",
        ].join("\n"),
      });
    }

    return Response.json({ ok: true, reference }, { status: 201 });
  } catch (error) {
    console.error("Pledge error:", error);
    return Response.json(
      { error: "Something went wrong our end. Please try again." },
      { status: 500 }
    );
  }
}

/** GET — Admin only. Filterable list for the donations screen. */
export async function GET(request: Request) {
  try {
    await requirePermission("donations.read");

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const method = url.searchParams.get("method");

    const clauses = [];
    if (status === "pending" || status === "confirmed" || status === "rejected") {
      clauses.push(eq(donations.status, status));
    }
    if (method === "bank_transfer" || method === "cash") {
      clauses.push(eq(donations.method, method));
    }

    const rows = await db
      .select({
        id: donations.id,
        donorName: donations.donorName,
        donorEmail: donations.donorEmail,
        amount: donations.amount,
        currency: donations.currency,
        method: donations.method,
        status: donations.status,
        reference: donations.reference,
        transferredAt: donations.transferredAt,
        proofUrl: donations.proofUrl,
        createdAt: donations.createdAt,
        confirmedAt: donations.confirmedAt,
        confirmedByName: users.name,
      })
      .from(donations)
      .leftJoin(users, eq(users.id, donations.confirmedById))
      .where(clauses.length ? and(...clauses) : undefined)
      .orderBy(desc(donations.createdAt));

    // Totals count CONFIRMED only — Hard Rule 1.
    const [totals] = await db
      .select({
        confirmedTotal: sql<string>`coalesce(sum(${donations.amount}) filter (where ${donations.status} = 'confirmed'), 0)::text`,
        pendingCount: sql<number>`count(*) filter (where ${donations.status} = 'pending')::int`,
      })
      .from(donations);

    return Response.json({ donations: rows, totals });
  } catch (error) {
    return toResponse(error);
  }
}
