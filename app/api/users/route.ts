import { asc, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { requirePermission, toResponse } from "@/lib/session";
import { createUserSchema, fieldErrors } from "@/lib/validation";

export async function GET() {
  try {
    // Hard Rule 2: permission first, before touching anything.
    await requirePermission("users.read");

    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        active: users.active,
        mustChangePassword: users.mustChangePassword,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(asc(users.createdAt));

    return Response.json({ users: rows });
  } catch (error) {
    return toResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission("users.create");

    const parsed = createUserSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input.", fields: fieldErrors(parsed.error) },
        { status: 422 }
      );
    }
    const { name, email, role, password } = parsed.data;

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing) {
      return Response.json(
        { error: "Invalid input.", fields: { email: "That email is already in use." } },
        { status: 409 }
      );
    }

    const [created] = await db
      .insert(users)
      .values({
        name,
        email,
        role,
        passwordHash: await bcrypt.hash(password, 12),
        // An Admin typed this password and will pass it on out-of-band, so it
        // is known to at least two people. The account is unusable for
        // anything else until the owner replaces it.
        mustChangePassword: true,
      })
      .returning({ id: users.id, email: users.email, role: users.role });

    return Response.json({ user: created }, { status: 201 });
  } catch (error) {
    return toResponse(error);
  }
}
