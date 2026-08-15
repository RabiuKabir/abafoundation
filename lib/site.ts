/**
 * The canonical public origin, used by sitemap.xml, robots.txt and canonical
 * URLs. Falls back to Vercel's generated host, then localhost — so previews
 * and local runs produce sane absolute URLs instead of broken ones.
 */
export function siteUrl(): string {
  const explicit = process.env.AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
