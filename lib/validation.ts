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

/* --------------------------------------------------------------------------
 * Content
 * ----------------------------------------------------------------------- */

export const activitySchema = z.object({
  title: z.string().trim().min(4, "Give it a title.").max(255),
  categoryId: z.string().trim().min(1, "Choose a category."),
  summary: z
    .string()
    .trim()
    .min(20, "Write a sentence or two — this is what shows on the cards.")
    .max(500),
  body: z.string().trim().min(50, "The story needs a bit more than this."),
  coverMediaId: z.string().trim().nullish(),
  publishedAt: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (v ? new Date(v) : null))
    .refine((d) => d === null || !Number.isNaN(d.getTime()), "Invalid date."),
  seoTitle: z.string().trim().max(255).optional().nullable(),
  seoDescription: z.string().trim().max(300).optional().nullable(),
});

/** Returning a draft to its author needs a reason the author can act on. */
export const reviewDecisionSchema = z.object({
  decision: z.enum(["publish", "return"]),
  note: z.string().trim().max(1000).optional(),
});

export const mediaSchema = z.object({
  url: z.string().trim().url("Must be a valid URL.").max(600),
  type: z.enum(["image", "video"]).default("image"),
  // Never optional. An image without alt text is invisible to a screen reader
  // and the design system treats accessibility as part of looking finished.
  altText: z
    .string()
    .trim()
    .min(4, "Describe the image for people who can't see it.")
    .max(300),
  activityId: z.string().trim().nullish(),
});

/* --------------------------------------------------------------------------
 * Public forms
 * ----------------------------------------------------------------------- */

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Tell us your name.").max(255),
  email: emailSchema,
  message: z
    .string()
    .trim()
    .min(10, "A little more detail, please.")
    .max(5000, "That's longer than we can accept — please summarise."),
  // Honeypot: a real person never sees this field, so anything in it is a bot.
  website: z.string().max(0, "Rejected.").optional(),
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
