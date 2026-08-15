/**
 * Server-side validation — Hard Rule 3. Every input is parsed here before it
 * reaches the database. Never trust a client-side check.
 */
import { z } from "zod";

export const PASSWORD_MIN = 10;

/**
 * Deliberately not a zoo of character-class rules: length is what actually
 * buys resistance to guessing, and complexity rules push people towards
 * Passw0rd! — so we ask for length and reject the obvious.
 */
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters.`)
  .max(200, "Password is too long.")
  .refine(
    (v) => !/^(password|12345678|qwerty)/i.test(v),
    "Please choose something less guessable."
  );

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.")
  .max(255);

export const loginSchema = z.object({
  email: emailSchema,
  // Not `passwordSchema`: an existing password only has to match, and applying
  // new-password rules at login would lock out accounts created before them.
  password: z.string().min(1, "Enter your password.").max(200),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Enter a name.").max(255),
  email: emailSchema,
  role: z.enum(["admin", "editor"]),
  password: passwordSchema,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "The two passwords don't match.",
    path: ["confirmPassword"],
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    message: "Choose a password you haven't used here before.",
    path: ["newPassword"],
  });

export const setActiveSchema = z.object({
  active: z.boolean(),
});

/** Flatten a ZodError into { field: message } for inline form errors. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
