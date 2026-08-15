import { db } from "@/lib/db";
import { contacts } from "@/db/schema";
import { contactSchema, fieldErrors } from "@/lib/validation";
import { clientIp, rateLimit, sweepExpired } from "@/lib/rate-limit";

/**
 * Public contact form. No auth — so it gets a honeypot and a rate limit, and
 * everything is validated server-side (Hard Rule 3).
 */
export async function POST(request: Request) {
  try {
    sweepExpired();

    const ip = clientIp(request);
    const { ok, retryAfterSeconds } = rateLimit({
      key: `contact:${ip}`,
      limit: 3,
      windowMs: 10 * 60 * 1000,
    });
    if (!ok) {
      return Response.json(
        { error: "That's a few messages in a short time. Please try again shortly." },
        { status: 429, headers: { "retry-after": String(retryAfterSeconds) } }
      );
    }

    const parsed = contactSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { error: "Please check the form.", fields: fieldErrors(parsed.error) },
        { status: 422 }
      );
    }

    // Honeypot: the field is hidden from people, so anything in it is a bot.
    // Answer 200 so the bot has nothing to learn from the difference.
    if (parsed.data.website) {
      return Response.json({ ok: true });
    }

    await db.insert(contacts).values({
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return Response.json(
      { error: "Something went wrong our end. Please try again." },
      { status: 500 }
    );
  }
}
