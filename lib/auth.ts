import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

import { authConfig } from "@/auth.config";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { loginSchema } from "@/lib/validation";

/**
 * When the email doesn't exist we still run a bcrypt comparison, so a missing
 * account costs the same time as a wrong password. Without it, response
 * timing tells an attacker which addresses are registered.
 *
 * It must be a genuine hash at the same cost factor — comparing against a
 * malformed string returns instantly and reintroduces the very leak. Built
 * lazily so the cost is only paid on a failed lookup, not at cold start.
 */
let dummyHash: string | undefined;
function getDummyHash(): string {
  return (dummyHash ??= bcrypt.hashSync(
    `no-account-${Date.now()}-${Math.random()}`,
    12
  ));
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        // Always compare, even when there's no user — see getDummyHash().
        const ok = await bcrypt.compare(
          password,
          user?.passwordHash ?? getDummyHash()
        );

        if (!user || !ok) return null;
        // A deactivated account cannot sign in at all. Same generic failure,
        // so deactivation isn't detectable from the login form either.
        if (!user.active) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
});
