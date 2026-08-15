/**
 * Money handling.
 *
 * Amounts come out of Postgres `numeric` as STRINGS, and they stay strings
 * everywhere except formatting. Parsing them into JS numbers invites the
 * classic 0.1 + 0.2 problem into a donation ledger, so don't — sum in SQL,
 * format at the edge.
 */
export const CURRENCY = "NGN";
export const CURRENCY_SYMBOL = "₦";
export const LOCALE = "en-NG";

/** "12500.00" → "₦12,500" (kobo shown only when they aren't zero). */
export function formatMoney(
  amount: string | number | null | undefined,
  currency: string = CURRENCY
): string {
  if (amount === null || amount === undefined || amount === "") return "—";
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(value)) return "—";

  const hasFraction = Math.round(value * 100) % 100 !== 0;
  try {
    return new Intl.NumberFormat(LOCALE, {
      style: "currency",
      currency,
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    // Unknown currency code — better a readable fallback than a thrown page.
    return `${currency} ${value.toLocaleString(LOCALE)}`;
  }
}

/**
 * Accept what a person actually types — "5,000", "₦5000", " 5000.50 " — and
 * return a canonical decimal string, or null if it isn't a usable amount.
 */
export function parseAmount(input: string): string | null {
  const cleaned = input.replace(/[₦,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  // decimal(10,2) tops out just under 100,000,000.
  if (value > 99_999_999.99) return null;
  return value.toFixed(2);
}
