import "server-only";

import { db } from "@/lib/db";
import { auditLogs } from "@/db/schema";

/**
 * The audit trail — append only, never updated or deleted.
 *
 * Every action that moves money or changes who can do what writes a row here.
 * `audit_logs.user_id` is ON DELETE SET NULL precisely so a log entry outlives
 * the account it names.
 *
 * Deliberately never throws: a failure to log must not roll back or block the
 * action the user just took. It is loud in the server log instead, so a broken
 * audit trail is noticed rather than silent.
 */
export type AuditAction =
  | "donation.create.public"
  | "donation.create.offline"
  | "donation.confirm"
  | "donation.reject"
  | "activity.publish"
  | "activity.return"
  | "user.create"
  | "user.activate"
  | "user.deactivate"
  | "user.role.change"
  | "user.password.change"
  | "activity.reassign"
  | "message.handle"
  | "report.export"
  | "settings.update";

export async function writeAudit({
  userId,
  action,
  entity,
  entityId,
  meta,
}: {
  userId: string | null;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId,
      action,
      entity,
      entityId: entityId ?? null,
      meta: meta ?? null,
    });
  } catch (error) {
    console.error(`AUDIT WRITE FAILED [${action} ${entity}:${entityId}]`, error);
  }
}
