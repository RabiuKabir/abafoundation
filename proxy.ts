import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/auth.config";
import { actionForPath, can } from "@/lib/rbac";

const { auth } = NextAuth(authConfig);

/**
 * First gate on the (admin) tree. (Next 16 calls this file `proxy.ts`; it is
 * what older versions called `middleware.ts`.)
 *
 * This is a cheap, token-only check on the edge — it cannot reach the
 * database. It exists to bounce anonymous visitors to /login and to keep a
 * role out of a section it has no business seeing, without a round trip.
 *
 * It is NOT the authorization boundary. Every page and route handler behind
 * it repeats the check against the database (lib/session.ts), because the
 * token is a snapshot and because a route must never assume this ran.
 */
const PUBLIC_PREFIXES = [
  "/",
  "/about",
  "/programs",
  "/donate",
  "/contact",
  "/privacy",
  "/terms",
  "/login",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || (p !== "/" && pathname.startsWith(`${p}/`))
  );
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  if (isPublic(pathname)) {
    // Already signed in? No reason to show the login form again.
    if (pathname === "/login" && user) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
    return NextResponse.next();
  }

  if (!user) {
    const login = new URL("/login", req.nextUrl);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  // A temporary password must be replaced before anything else is reachable.
  if (user.mustChangePassword && pathname !== "/change-password") {
    return NextResponse.redirect(new URL("/change-password", req.nextUrl));
  }
  if (!user.mustChangePassword && pathname === "/change-password") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  const action = actionForPath(pathname);
  if (action && !can(user, action)) {
    return NextResponse.redirect(new URL("/dashboard?denied=1", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Everything except Next internals, the auth endpoints themselves, and
  // static files. API routes do their own checks and are excluded here so a
  // 403 stays a 403 instead of becoming a redirect to an HTML page.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.\\w+$).*)"],
};
