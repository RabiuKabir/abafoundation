"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export type LoginState = { error?: string };

/**
 * One generic failure message for every cause — wrong password, unknown
 * email, deactivated account. Telling them apart would let anyone use the
 * login form to discover which addresses have accounts.
 */
const GENERIC = "Those details don't match an active account.";

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: GENERIC };

  const next = String(formData.get("next") || "/dashboard");
  // Only ever redirect within this site — an open redirect here would be a
  // gift to a phisher ("log in", then land on their page).
  const safeNext = next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/dashboard";

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: safeNext,
    });
  } catch (error) {
    if (error instanceof AuthError) return { error: GENERIC };
    // signIn throws a redirect on success — let it through.
    throw error;
  }

  return {};
}
