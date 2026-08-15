import "server-only";

/**
 * A small in-memory fixed-window limiter for public forms.
 *
 * Deliberately not Redis — the spec defers that, and this is a low-traffic
 * site. The honest limitation: state lives in one server process, so on
 * serverless it resets on cold start and is not shared between instances. It
 * raises the cost of casual spam and accidental double-submits; it is not a
 * defence against a determined distributed attack. Revisit in Phase 5 if the
 * contact form actually gets abused.
 */
type Window = { count: number; resetAt: number };

const buckets = new Map<string, Window>();

export function rateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

/** Best-effort client IP behind Vercel's proxy. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** Keep the map from growing without bound on a long-lived server. */
export function sweepExpired(): void {
  const now = Date.now();
  for (const [key, window] of buckets) {
    if (window.resetAt <= now) buckets.delete(key);
  }
}
