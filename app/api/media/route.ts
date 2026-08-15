import { db } from "@/lib/db";
import { media } from "@/db/schema";
import { requirePermission, toResponse } from "@/lib/session";
import { StorageNotConfiguredError, uploadImage } from "@/lib/storage";

/**
 * Upload an image and record it in the media table.
 *
 * Three rules, all enforced here rather than in the browser: the caller must
 * hold `media.create`, the file must be an accepted image within the size
 * limit, and alt text is mandatory.
 */
export async function POST(request: Request) {
  try {
    const user = await requirePermission("media.create");

    const form = await request.formData();
    const file = form.get("file");
    const altText = String(form.get("altText") ?? "").trim();
    const activityId = String(form.get("activityId") ?? "").trim() || null;

    if (!(file instanceof File)) {
      return Response.json({ error: "No file received." }, { status: 422 });
    }
    if (altText.length < 4) {
      return Response.json(
        { error: "Alt text is required — describe the image." },
        { status: 422 }
      );
    }

    const { url } = await uploadImage(file);

    const [created] = await db
      .insert(media)
      .values({
        url,
        type: "image",
        altText,
        activityId,
        createdById: user.id,
      })
      .returning({ id: media.id, url: media.url, altText: media.altText });

    return Response.json({ media: created }, { status: 201 });
  } catch (error) {
    if (error instanceof StorageNotConfiguredError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof Error && /image|file|empty/i.test(error.message)) {
      return Response.json({ error: error.message }, { status: 422 });
    }
    return toResponse(error);
  }
}
