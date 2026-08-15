/**
 * Slugs are part of the public URL and are unique in the database, so they
 * have to be both readable and collision-safe.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    // strip accents so "Sadaqah Jāriyah" becomes "sadaqah-jariyah"
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 260);
}

/**
 * Append -2, -3 … until the slug is free. `taken` is whatever the caller
 * already found in the database.
 */
export function uniqueSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  const root = base || "untitled";
  if (!used.has(root)) return root;
  for (let n = 2; n < 1000; n++) {
    const candidate = `${root}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
  // Effectively unreachable, but never return a duplicate.
  return `${root}-${Date.now()}`;
}
