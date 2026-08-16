import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { settings } from "@/db/schema";
import { requirePermission, toResponse } from "@/lib/session";
import {
  bankSettingsSchema,
  fieldErrors,
  orgSettingsSchema,
} from "@/lib/validation";
import { writeAudit } from "@/lib/audit";
import { CURRENCY, CURRENCY_SYMBOL, LOCALE } from "@/lib/money";

export async function GET() {
  try {
    await requirePermission("settings.read");
    const rows = await db
      .select({ key: settings.key, value: settings.value })
      .from(settings);
    return Response.json({
      settings: Object.fromEntries(rows.map((r) => [r.key, r.value])),
    });
  } catch (error) {
    return toResponse(error);
  }
}

/**
 * Update a settings group.
 *
 * The bank details are the highest-consequence field in the app: a donor
 * copies them into their banking app, and a wrong digit sends money to a
 * stranger. So they are validated strictly, saving clears the `demo` flag
 * that puts the warning banner on the Donate page, and every change is
 * audited with the old and new values.
 */
export async function PUT(request: Request) {
  try {
    const admin = await requirePermission("settings.update");
    const body = await request.json();
    const group = String(body?.group ?? "");

    if (group !== "org" && group !== "bank_details") {
      return Response.json({ error: "Unknown settings group." }, { status: 422 });
    }

    const schema = group === "org" ? orgSettingsSchema : bankSettingsSchema;
    const parsed = schema.safeParse(body?.value);
    if (!parsed.success) {
      return Response.json(
        { error: "Please check the form.", fields: fieldErrors(parsed.error) },
        { status: 422 }
      );
    }

    const [existing] = await db
      .select({ value: settings.value })
      .from(settings)
      .where(eq(settings.key, group))
      .limit(1);

    const value =
      group === "org"
        ? {
            ...parsed.data,
            currency: CURRENCY,
            currencySymbol: CURRENCY_SYMBOL,
            locale: LOCALE,
          }
        : {
            ...parsed.data,
            currency: CURRENCY,
            // Saving real details retires the placeholder warning on Donate.
            demo: false,
          };

    if (existing) {
      await db.update(settings).set({ value }).where(eq(settings.key, group));
    } else {
      await db.insert(settings).values({ key: group, value });
    }

    await writeAudit({
      userId: admin.id,
      action: "settings.update",
      entity: "settings",
      entityId: group,
      meta: { group, before: existing?.value ?? null, after: value },
    });

    return Response.json({ ok: true, value });
  } catch (error) {
    return toResponse(error);
  }
}
