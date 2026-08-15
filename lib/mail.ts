import "server-only";

/**
 * Transactional email.
 *
 * Resend isn't configured yet — no verified sending domain — so until
 * RESEND_API_KEY and EMAIL_FROM exist, messages are written to the server log
 * instead of sent. That keeps the flows real and reviewable now, and turning
 * sending on is a matter of filling in two env vars.
 *
 * Never throws. An acknowledgement that fails to send must not lose the
 * donation it is acknowledging.
 */
export type Mail = {
  to: string;
  subject: string;
  text: string;
};

export function isMailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendMail(mail: Mail): Promise<{ sent: boolean }> {
  if (!isMailConfigured()) {
    console.info(
      [
        "",
        "──────────── EMAIL (not sent — Resend not configured) ────────────",
        `To:      ${mail.to}`,
        `Subject: ${mail.subject}`,
        "",
        mail.text,
        "──────────────────────────────────────────────────────────────────",
        "",
      ].join("\n")
    );
    return { sent: false };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
      }),
    });

    if (!res.ok) {
      console.error("Resend rejected the message:", res.status, await res.text());
      return { sent: false };
    }
    return { sent: true };
  } catch (error) {
    console.error("Could not reach Resend:", error);
    return { sent: false };
  }
}

/** Where Finance alerts go. Falls back to the from-address, then nowhere. */
export function financeInbox(): string | null {
  return (
    process.env.FINANCE_ALERT_EMAIL ||
    process.env.EMAIL_FROM?.match(/<(.+)>/)?.[1] ||
    process.env.EMAIL_FROM ||
    null
  );
}
