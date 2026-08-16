import { and, eq, inArray, ne } from "drizzle-orm";

import { db } from "@/lib/db";
import { activities, users } from "@/db/schema";
import { HttpError, requirePermission, toResponse } from "@/lib/session";
import { updateUserSchema, fieldErrors } from "@/lib/validation";
import { writeAudit } from "@/lib/audit";

/**
 * Change a user's role, or activate/deactivate them. We never delete staff —
 * the foreign keys are ON DELETE RESTRICT precisely so content and donations
 * keep their attribution.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requirePermission("users.update");
    const { id } = await params;

    const parsed = updateUserSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input.", fields: fieldErrors(parsed.error) },
        { status: 422 }
      );
    }
    const { active, role } = parsed.data;

    const [target] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        active: users.active,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!target) throw new HttpError(404, "No such user.");

    // Guard against locking everyone out: you can't remove your own access,
    // and you can't remove the last active Admin — there is no recovery from
    // that except the break-glass seed script.
    const losingAdmin =
      (active === false && target.role === "admin" && target.active) ||
      (role === "editor" && target.role === "admin" && target.active);

    if (target.id === actor.id && (active === false || role === "editor")) {
      throw new HttpError(409, "You can't remove your own access.");
    }

    if (losingAdmin) {
      const others = await db
        .select({ id: users.id })
        .from(users)
        .where(
          and(eq(users.role, "admin"), eq(users.active, true), ne(users.id, id))
        );
      if (others.length === 0) {
        throw new HttpError(
          409,
          "This is the last active Admin. Promote someone else first."
        );
      }
    }

    const changes: { active?: boolean; role?: "admin" | "editor" } = {};
    if (active !== undefined && active !== target.active) changes.active = active;
    if (role !== undefined && role !== target.role) changes.role = role;

    if (Object.keys(changes).length === 0) {
      return Response.json({ ok: true, unchanged: true });
    }

    await db.update(users).set(changes).where(eq(users.id, id));

    if (changes.role) {
      await writeAudit({
        userId: actor.id,
        action: "user.role.change",
        entity: "user",
        entityId: target.id,
        meta: { email: target.email, from: target.role, to: changes.role },
      });
    }

    if (changes.active !== undefined) {
      await writeAudit({
        userId: actor.id,
        action: changes.active ? "user.activate" : "user.deactivate",
        entity: "user",
        entityId: target.id,
        meta: { email: target.email },
      });
    }

    // Deactivating someone leaves their unfinished work with no one to carry
    // it on. Hand the drafts to the Admin doing the deactivating. Published
    // work keeps its original author — that is a matter of record, not
    // ownership.
    let reassigned = 0;
    if (changes.active === false) {
      const moved = await db
        .update(activities)
        .set({ authorId: actor.id })
        .where(
          and(
            eq(activities.authorId, target.id),
            inArray(activities.status, ["draft", "in_review"])
          )
        )
        .returning({ id: activities.id });
      reassigned = moved.length;

      if (reassigned > 0) {
        await writeAudit({
          userId: actor.id,
          action: "activity.reassign",
          entity: "user",
          entityId: target.id,
          meta: {
            from: target.email,
            to: actor.email,
            count: reassigned,
            activityIds: moved.map((m) => m.id),
          },
        });
      }
    }

    return Response.json({ ok: true, ...changes, reassigned });
  } catch (error) {
    return toResponse(error);
  }
}
