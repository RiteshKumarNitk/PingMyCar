import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * S3-compatible object storage (Neon object storage / any S3 API).
 *
 * Security model:
 * - Credentials live ONLY in server-side env vars (never NEXT_PUBLIC_*).
 * - The `userprofile` bucket is private: browsers never get bucket URLs,
 *   only short-lived pre-signed download URLs minted by this module.
 * - Every function is a no-op (returns null / isConfigured=false) when the
 *   AWS_* env vars are absent, so dev/CI never needs storage credentials.
 */

const endpoint = process.env.AWS_ENDPOINT_URL_S3;
const region = process.env.AWS_REGION ?? "ap-southeast-1";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

/** Private bucket — owner profile images and other per-user private assets. */
export const PRIVATE_BUCKET = "userprofile";

let client: S3Client | null = null;

/**
 * The singleton S3 client. Shared by every storage consumer (presign, reads,
 * sticker-asset upload) so there is exactly one owner of client construction.
 * Call only when isStorageConfigured() is true.
 */
export function s3Client(): S3Client {
  if (!client) {
    client = new S3Client({
      region,
      ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
    });
  }
  return client;
}

export function isStorageConfigured(): boolean {
  return Boolean(endpoint && accessKeyId && secretAccessKey);
}

/** True when the key belongs to the private bucket namespace. */
export function privateObjectKey(userId: string, filename: string): string {
  // Keys are namespaced per user; filenames are sanitized server-side.
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `userprofile/${userId}/${safe}`;
}

/**
 * Pre-signed PUT URL so a browser can upload directly into the private
 * bucket without ever holding credentials. Short expiry.
 */
export async function presignUpload(key: string, contentType: string): Promise<string | null> {
  if (!isStorageConfigured()) return null;
  const bucket = PRIVATE_BUCKET;
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  return getSignedUrl(s3Client(), command, { expiresIn: 300 }); // 5 minutes
}

/**
 * Pre-signed GET URL for reading a private object — the only way a browser
 * ever sees private content. Limited expiry by design.
 */
export async function presignDownload(key: string, expiresIn = 60): Promise<string | null> {
  if (!isStorageConfigured()) return null;
  const command = new GetObjectCommand({ Bucket: PRIVATE_BUCKET, Key: key });
  return getSignedUrl(s3Client(), command, { expiresIn }); // default: 60 seconds
}

export async function deleteObject(key: string): Promise<void> {
  if (!isStorageConfigured()) return;
  await s3Client().send(new DeleteObjectCommand({ Bucket: PRIVATE_BUCKET, Key: key }));
}
