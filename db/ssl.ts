/**
 * Decide TLS mode for a Postgres URL.
 *
 * An explicit `?sslmode=` in the connection string always wins. Only when it
 * is absent do we fall back to guessing from the host — which is wrong when
 * the connection is tunnelled through localhost to a managed database that
 * still requires TLS (see scripts/pg-tunnel.mjs).
 */
export function sslFor(url: string): "require" | false {
  let mode: string | null = null;
  try {
    mode = new URL(url).searchParams.get("sslmode");
  } catch {
    // not a parseable URL — fall through to the host heuristic
  }

  if (mode === "disable") return false;
  if (mode) return "require";

  return /@(localhost|127\.0\.0\.1)[:/]/.test(url) ? false : "require";
}
