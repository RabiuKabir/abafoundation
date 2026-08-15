import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { donations } from "@/db/schema";
import { requirePermission, toResponse } from "@/lib/session";
import { fieldErrors, offlineDonationSchema } from "@/lib/validation";
import { writeAudit } from "@/lib/audit";
import { referenceFor } from "@/lib/settings";

/**
 * An Admin recording money they have already seen — cash in hand, or a
 * transfer on the statement with no matching pledge.
 *
 * This creates the row already `confirmed`, which looks like it bends Hard
 * Rule 1 but doesn't: the rule is that *the public* can never confirm money.
 * Here an Admin with `donations.create` is doing exactly the same verification
 * they would do on the confirm screen, in one step instead of two. It is
 * attributed to them and audited identically.
 */
export async function POST(request: Request) {
  try {
    const admin = await requirePermission("donations.create");

    const parsed = offlineDonationSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input.", fields: fieldErrors(parsed.error) },
        { status: 422 }
      );
    }
    const data = parsed.data;

    const [created] = await db
      .insert(donations)
      .values({
        donorName: data.donorName || null,
        donorEmail: data.donorEmail || null,
        amount: data.amount,
        method: data.method,
        reference: data.reference ?? null,
        transferredAt: data.transferredAt ?? null,
        activityId: data.activityId ?? null,
        status: "confirmed",
        confirmedById: admin.id,
        confirmedAt: new Date(),
      })
      .returning({ id: donations.id, amount: donations.amount });

    await db
      .update(donations)
      .set({ receiptNo: referenceFor(created.id) })
      .where(eq(donations.id, created.id));

    await writeAudit({
      userId: admin.id,
      action: "donation.create.offline",
      entity: "donation",
      entityId: created.id,
      meta: {
        amount: created.amount,
        method: data.method,
        enteredBy: admin.email,
      },
    });

    return Response.json({ ok: true, id: created.id }, { status: 201 });
  } catch (error) {
    return toResponse(error);
  }
}
