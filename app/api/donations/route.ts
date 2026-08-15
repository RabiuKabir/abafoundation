import { requirePermission, toResponse } from "@/lib/session";

/**
 * Shell endpoint. The permission check is real and is the Phase 1 gate:
 * an Editor calling this gets 403 from the server, regardless of what the
 * UI showed them. The payload arrives in a later phase.
 */
export async function GET() {
  try {
    await requirePermission("donations.read");
    return Response.json({ ok: true, data: [] });
  } catch (error) {
    return toResponse(error);
  }
}
