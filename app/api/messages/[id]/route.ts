import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { contacts } from "@/db/schema";
import { HttpError, requirePermission, toResponse } from "@/lib/session";
import { writeAudit } from "@/lib/audit";

const schema = z.object({ status: z.enum(["new", "handled"]) });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requirePermission("messages.update");
    const { id } = await params;

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: "Invalid input." }, { status: 422 });
    }

    const [row] = await db
      .select({ id: contacts.id, email: contacts.email })
      .from(contacts)
      .where(eq(contacts.id, id))
      .limit(1);
    if (!row) throw new HttpError(404, "No such message.");

    await db
      .update(contacts)
      .set({ status: parsed.data.status })
      .where(eq(contacts.id, id));

    await writeAudit({
      userId: admin.id,
      action: "message.handle",
      entity: "contact",
      entityId: id,
      meta: { from: row.email, status: parsed.data.status },
    });

    return Response.json({ ok: true, status: parsed.data.status });
  } catch (error) {
    return toResponse(error);
  }
}
