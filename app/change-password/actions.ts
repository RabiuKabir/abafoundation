"use server";

import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { signOut } from "@/lib/auth";
import { getCurrentUser } from "@/lib/session";
import { changePasswordSchema, fieldErrors } from "@/lib/validation";

export type ChangePasswordState = {
  errors?: Record<string, string>;
  error?: string;
};

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session has expired. Sign in again." };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  // Re-check the current password against the database — never trust that
  // holding a session proves knowledge of the password.
  const [row] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!row) return { error: "Your account no longer exists." };

  const ok = await bcrypt.compare(parsed.data.currentPassword, row.passwordHash);
  if (!ok) {
    return { errors: { currentPassword: "That isn't your current password." } };
  }

  await db
    .update(users)
    .set({
      passwordHash: await bcrypt.hash(parsed.data.newPassword, 12),
      mustChangePassword: false,
    })
    .where(eq(users.id, user.id));

  // Changing a credential ends the session that was created with the old one.
  // It also gets the stale mustChangePassword claim out of the JWT without
  // any token-refresh gymnastics.
  await signOut({ redirectTo: "/login?changed=1" });
  return {};
}
