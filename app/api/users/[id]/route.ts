import { and, eq, ne } from "drizzle-orm";

import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { requirePermission, toResponse } from "@/lib/session";
import { setActiveSchema } from "@/lib/validation";

/** Activate / deactivate. We never delete staff — see the FK policy. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requirePermission("users.update");
    const { id } = await params;

    const parsed = setActiveSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: "Invalid input." }, { status: 422 });
    }
    const { active } = parsed.data;

    if (id === actor.id && !active) {
      return Response.json(
        { error: "You can't deactivate your own account." },
        { status: 409 }
      );
    }

    const [target] = await db
      .select({ id: users.id, role: users.role, active: users.active })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!target) {
      return Response.json({ error: "No such user." }, { status: 404 });
    }

    // Locking every Admin out of the system is unrecoverable without the
    // break-glass seed, so refuse to remove the last active one.
    if (target.role === "admin" && target.active && !active) {
      const others = await db
        .select({ id: users.id })
        .from(users)
        .where(
          and(eq(users.role, "admin"), eq(users.active, true), ne(users.id, id))
        );
      if (others.length === 0) {
        return Response.json(
          { error: "This is the last active Admin. Promote someone else first." },
          { status: 409 }
        );
      }
    }

    await db.update(users).set({ active }).where(eq(users.id, id));
    return Response.json({ ok: true, active });
  } catch (error) {
    return toResponse(error);
  }
}
