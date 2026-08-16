import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { activities } from "@/db/schema";
import { HttpError, requirePermission, toResponse } from "@/lib/session";
import { fieldErrors, reviewDecisionSchema } from "@/lib/validation";
import { writeAudit } from "@/lib/audit";

/**
 * The approval decision — Admin only. This is the gate: `activities.publish`
 * is granted to admin and to nobody else in lib/rbac.ts, so this is the single
 * door between an Editor's draft and the public site.
 *
 * publish → status becomes `published` and publishedAt is stamped if unset.
 * return  → back to `draft` so the author can work on it again.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requirePermission("activities.publish");
    const { id } = await params;

    const parsed = reviewDecisionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input.", fields: fieldErrors(parsed.error) },
        { status: 422 }
      );
    }
    const { decision } = parsed.data;

    const [row] = await db
      .select({
        id: activities.id,
        status: activities.status,
        publishedAt: activities.publishedAt,
        deletedAt: activities.deletedAt,
      })
      .from(activities)
      .where(eq(activities.id, id))
      .limit(1);

    if (!row || row.deletedAt) throw new HttpError(404, "No such activity.");

    if (decision === "return") {
      if (row.status !== "in_review") {
        throw new HttpError(409, `Nothing to return — it is ${row.status}.`);
      }
      await db
        .update(activities)
        .set({ status: "draft" })
        .where(eq(activities.id, id));

      await writeAudit({
        userId: admin.id,
        action: "activity.return",
        entity: "activity",
        entityId: id,
        meta: { note: parsed.data.note ?? null },
      });

      return Response.json({ ok: true, status: "draft" });
    }

    if (row.status !== "in_review" && row.status !== "draft") {
      throw new HttpError(409, `Can't publish something that is ${row.status}.`);
    }

    await db
      .update(activities)
      .set({
        status: "published",
        publishedAt: row.publishedAt ?? new Date(),
      })
      .where(eq(activities.id, id));

    await writeAudit({
      userId: admin.id,
      action: "activity.publish",
      entity: "activity",
      entityId: id,
      meta: { previousStatus: row.status },
    });

    return Response.json({ ok: true, status: "published" });
  } catch (error) {
    return toResponse(error);
  }
}
