import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { settings } from "@/db/schema";

export type BankDetails = {
  accountName: string;
  accountNumber: string;
  bankName: string;
  currency: string;
  referenceHint: string;
  /** True while these are still the seeded placeholders. */
  demo?: boolean;
};

export type OrgDetails = {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  currency: string;
  currencySymbol: string;
  locale: string;
};

async function readSetting<T>(key: string): Promise<T | null> {
  const [row] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);
  return (row?.value as T) ?? null;
}

export function getBankDetails(): Promise<BankDetails | null> {
  return readSetting<BankDetails>("bank_details");
}

export function getOrgDetails(): Promise<OrgDetails | null> {
  return readSetting<OrgDetails>("org");
}

/**
 * The reference a donor should quote. Tied to the donation id so an Admin can
 * match a line on the bank statement to a row without guessing — the whole
 * confirmation step depends on this being findable.
 */
export function referenceFor(donationId: string): string {
  return `ABA-${donationId.slice(-6).toUpperCase()}`;
}
