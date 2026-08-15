import type { NextAuthConfig } from "next-auth";

import type { Role } from "@/lib/rbac";

/**
 * Edge-safe half of the auth setup.
 *
 * middleware.ts runs on the edge runtime, where the Postgres driver cannot go.
 * So this file holds only what a JWT needs — no database, no bcrypt. The
 * Credentials provider (which does both) lives in lib/auth.ts, used from the
 * Node runtime.
 *
 * The claims below are a *hint*, not the authority. A JWT is a snapshot from
 * sign-in time: deactivate someone and their existing token still says
 * active. Middleware uses it for a cheap first gate; every route then
 * re-checks against the database via lib/session.ts. See Hard Rule 2.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    // Short enough that a deactivated account's token dies quickly.
    maxAge: 60 * 60 * 8,
  },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: Role }).role;
        token.active = (user as { active: boolean }).active;
        token.mustChangePassword = (
          user as { mustChangePassword: boolean }
        ).mustChangePassword;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.active = token.active as boolean;
        session.user.mustChangePassword = token.mustChangePassword as boolean;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
