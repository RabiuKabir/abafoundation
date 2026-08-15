import "server-only";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createId } from "@paralleldrive/cuid2";

/**
 * S3-compatible object storage. Configured for Supabase Storage, but the same
 * code works against Cloudflare R2 or AWS S3 — only the env vars change.
 *
 * Media never touches the database or the app's disk: we store the URL.
 */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export class StorageNotConfiguredError extends Error {
  constructor() {
    super(
      "File storage isn't configured. Set S3_BUCKET, S3_REGION, S3_ENDPOINT, S3_ACCESS_KEY and S3_SECRET_KEY in .env."
    );
    this.name = "StorageNotConfiguredError";
  }
}

function config() {
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION;
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;
  const endpoint = process.env.S3_ENDPOINT || undefined;

  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    throw new StorageNotConfiguredError();
  }
  return { bucket, region, accessKeyId, secretAccessKey, endpoint };
}

export function isStorageConfigured(): boolean {
  try {
    config();
    return true;
  } catch {
    return false;
  }
}

/**
 * The public URL for an object. Supabase serves public buckets from
 * /storage/v1/object/public/<bucket>/<key>, which is not the S3 path — so
 * derive it from the S3 endpoint rather than guessing.
 */
function publicUrl(key: string): string {
  const { bucket, endpoint } = config();
  if (endpoint?.includes(".supabase.co")) {
    const base = endpoint.replace(/\/storage\/v1\/s3\/?$/, "");
    return `${base}/storage/v1/object/public/${bucket}/${key}`;
  }
  if (endpoint) return `${endpoint.replace(/\/$/, "")}/${bucket}/${key}`;
  const { region } = config();
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export async function uploadImage(file: File): Promise<{ url: string; key: string }> {
  const { bucket, region, accessKeyId, secretAccessKey, endpoint } = config();

  // Re-check server-side. The browser's checks are a courtesy, not a control.
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    throw new Error("Unsupported image type.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`Images must be ${MAX_UPLOAD_BYTES / 1024 / 1024}MB or smaller.`);
  }
  if (file.size === 0) throw new Error("That file is empty.");

  const client = new S3Client({
    region,
    endpoint,
    forcePathStyle: Boolean(endpoint),
    credentials: { accessKeyId, secretAccessKey },
  });

  const key = `activities/${createId()}.${EXTENSIONS[file.type] ?? "bin"}`;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return { url: publicUrl(key), key };
}
