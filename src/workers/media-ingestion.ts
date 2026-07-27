import type { Job } from "bullmq";
import { db } from "@/lib/db";
import { contentHash } from "@/lib/media/hash";
import { mediaKey, uploadObject } from "@/lib/storage/r2";
import { enqueue } from "@/lib/queue/queues";
import { scoped } from "@/lib/logger";

const log = scoped("media-ingestion");
const MAX_MEDIA_BYTES = 300 * 1024 * 1024;

/**
 * "download" {mediaId, mediaUrl, thumbnailUrl}: download eligible media from
 * the Actor-provided URL, hash it, dedupe by content hash (store bytes once),
 * upload to R2, then queue AI analysis.
 */
export async function processMediaDownload(job: Job): Promise<void> {
  const { mediaId, mediaUrl, thumbnailUrl } = job.data as {
    mediaId: string;
    mediaUrl: string;
    thumbnailUrl?: string | null;
  };

  const media = await db.media.findUnique({ where: { id: mediaId } });
  if (!media || media.status === "STORED" || media.status === "READY") return;

  await db.media.update({ where: { id: mediaId }, data: { status: "DOWNLOADING" } });

  try {
    const { buffer, contentType } = await download(mediaUrl);
    const hash = contentHash(buffer);

    // Global dedupe by content hash: reuse existing blob, store bytes once.
    const duplicate = await db.media.findFirst({
      where: { contentHash: hash, storageKey: { not: null }, id: { not: mediaId } },
      select: { storageKey: true, thumbnailKey: true, mimeType: true, fileSize: true },
    });
    if (duplicate?.storageKey) {
      await db.media.update({
        where: { id: mediaId },
        data: {
          contentHash: hash,
          storageKey: duplicate.storageKey,
          thumbnailKey: duplicate.thumbnailKey,
          mimeType: duplicate.mimeType,
          fileSize: duplicate.fileSize,
          status: "STORED",
        },
      });
      log.info({ mediaId, hash }, "deduplicated by content hash");
    } else {
      const ext = contentType.includes("mp4") || contentType.includes("video") ? "mp4" : "bin";
      const key = mediaKey(media.userId, mediaId, `original.${ext}`);
      await uploadObject(key, buffer, contentType);

      let thumbKey: string | null = null;
      if (thumbnailUrl) {
        try {
          const thumb = await download(thumbnailUrl);
          thumbKey = mediaKey(media.userId, mediaId, "thumb.jpg");
          await uploadObject(thumbKey, thumb.buffer, thumb.contentType || "image/jpeg");
        } catch (err) {
          log.warn({ mediaId, err: String(err) }, "thumbnail download failed (non-fatal)");
        }
      }

      await db.media.update({
        where: { id: mediaId },
        data: {
          contentHash: hash,
          storageKey: key,
          thumbnailKey: thumbKey,
          mimeType: contentType,
          fileSize: buffer.length,
          fileName: `original.${ext}`,
          status: "STORED",
        },
      });
    }

    await enqueue("ai_analysis", "analyze", { mediaId }, { userId: media.userId });
  } catch (err) {
    await db.media.update({ where: { id: mediaId }, data: { status: "FAILED" } });
    throw err;
  }
}

async function download(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) throw new Error(`Media download failed: HTTP ${res.status}`);
  const lengthHeader = Number(res.headers.get("content-length") ?? 0);
  if (lengthHeader > MAX_MEDIA_BYTES) throw new Error("Media exceeds size limit");
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > MAX_MEDIA_BYTES) throw new Error("Media exceeds size limit");
  return { buffer, contentType: res.headers.get("content-type") ?? "application/octet-stream" };
}
