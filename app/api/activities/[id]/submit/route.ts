import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { activities } from "@/db/schema";
import { HttpError, requirePermission, toResponse } from "@/lib/session";

/**
 * draft → in_review. An Editor's only route towards the public site: they can
 * ask, but they cannot publish. Only an Admin moves it the last step.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermission("activities.submit");
    const { id } = await params;

    const [row] = await db
      .select({
        id: activities.id,
        authorId: activities.authorId,
        status: activities.status,
        deletedAt: activities.deletedAt,
      })
      .from(activities)
      .where(eq(activities.id, id))
      .limit(1);

    if (!row || row.deletedAt) throw new HttpError(404, "No such activity.");
    if (row.authorId !== user.id && user.role !== "admin") {
      throw new HttpError(403, "Not allowed.");
    }
    if (row.status !== "draft") {
      throw new HttpError(409, `Can't submit something that is ${row.status}.`);
    }

    await db
      .update(activities)
      .set({ status: "in_review" })
      .where(eq(activities.id, id));

    return Response.json({ ok: true, status: "in_review" });
  } catch (error) {
    return toResponse(error);
  }
}
