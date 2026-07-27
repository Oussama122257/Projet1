import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/lib/env";

/**
 * Cloudflare R2 via its S3-compatible API. One global bucket; keys are
 * namespaced per user: media/{userId}/{mediaId}/{filename}
 */
let client: S3Client | null = null;

function s3(): S3Client {
  if (client) return client;
  const e = env();
  if (!e.R2_ACCOUNT_ID || !e.R2_ACCESS_KEY_ID || !e.R2_SECRET_ACCESS_KEY) {
    throw new Error("R2 storage is not configured (R2_ACCOUNT_ID / keys missing)");
  }
  client = new S3Client({
    region: "auto",
    endpoint: `https://${e.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: e.R2_ACCESS_KEY_ID,
      secretAccessKey: e.R2_SECRET_ACCESS_KEY,
    },
  });
  return client;
}

export function mediaKey(userId: string, mediaId: string, fileName: string): string {
  return `media/${userId}/${mediaId}/${fileName}`;
}

export async function uploadObject(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<void> {
  await s3().send(
    new PutObjectCommand({
      Bucket: env().R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function deleteObject(key: string): Promise<void> {
  await s3().send(new DeleteObjectCommand({ Bucket: env().R2_BUCKET, Key: key }));
}

/** Short-lived pre-signed GET URL (e.g. for Metricool media normalization). */
export async function presignGetUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  return getSignedUrl(
    s3(),
    new GetObjectCommand({ Bucket: env().R2_BUCKET, Key: key }),
    { expiresIn: expiresInSeconds },
  );
}
