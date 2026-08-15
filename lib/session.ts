import "server-only";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { can, type Action, type Role } from "@/lib/rbac";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  mustChangePassword: boolean;
};

/**
 * The authoritative "who is this" — Hard Rule 2.
 *
 * Reads the session for an id, then loads the user FROM THE DATABASE. The JWT
 * is a snapshot from sign-in: if an Admin deactivates someone or changes their
 * role, the old token still carries the old claims until it expires. Trusting
 * it would leave a demoted user with their old powers. So the token supplies
 * identity; the database supplies authority.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      active: users.active,
      mustChangePassword: users.mustChangePassword,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!row || !row.active) return null;
  return row;
}

/** Thrown by the require* helpers; turned into a Response by toResponse(). */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/** For API routes: throws 401/403 instead of returning a user. */
export async function requirePermission(action: Action): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Not signed in.");
  if (!can(user, action)) throw new HttpError(403, "Not allowed.");
  return user;
}

/** Signed in, but no specific permission needed. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Not signed in.");
  return user;
}

/** Wrap a route handler body so HttpError becomes a proper JSON response. */
export function toResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error("Unhandled route error:", error);
  return Response.json({ error: "Something went wrong." }, { status: 500 });
}

/**
 * For pages: same check, but redirect rather than throw. Middleware already
 * turned anonymous visitors away — this repeats the check because middleware
 * only sees the token, and because a page must never rely on something
 * upstream having run.
 */
export async function requirePageAccess(action: Action): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");
  if (!can(user, action)) redirect("/dashboard?denied=1");
  return user;
}
