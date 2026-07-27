import type { Job } from "bullmq";
import { db } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto";
import { MetricoolApiError, MetricoolClient } from "@/lib/metricool";
import { presignGetUrl } from "@/lib/storage/r2";
import { enqueue } from "@/lib/queue/queues";
import { scoped } from "@/lib/logger";

const log = scoped("metricool-publisher");

/** Snapshot offsets for performance collection (configurable per deployment). */
const SYNC_OFFSETS_MS = [0, 3600_000, 6 * 3600_000, 24 * 3600_000, 72 * 3600_000];

/**
 * "publish" {scheduledPostId}: send a QUEUED post to Metricool via the
 * official API: presign R2 media → normalize on Metricool's servers →
 * POST /v2/scheduler/posts. Schedules the performance-sync snapshot chain.
 */
export async function processMetricoolPublish(job: Job): Promise<void> {
  const { scheduledPostId } = job.data as { scheduledPostId: string };

  const post = await db.scheduledPost.findUnique({
    where: { id: scheduledPostId },
    include: {
      media: true,
      pipeline: true,
      destination: { include: { connection: true } },
    },
  });
  if (!post || post.status !== "QUEUED") return;

  const connection = post.destination.connection;
  if (connection.status !== "CONNECTED") {
    await failPost(scheduledPostId, "Metricool connection is not healthy");
    return;
  }
  if (!post.media.storageKey) {
    await failPost(scheduledPostId, "Media has no stored file");
    return;
  }

  const client = new MetricoolClient({
    userToken: decryptSecret(connection.encryptedUserToken),
    userId: connection.metricoolUserId,
  });
  const blogId = post.destination.blogId;

  try {
    // 1. Time-limited public URL for our R2 object (user-attested content).
    const presigned = await presignGetUrl(post.media.storageKey, 3600);

    // 2. Metricool must copy the media to its servers before scheduling.
    const hostedUrl = await client.normalizeMediaUrl(presigned, blogId);

    // 3. Create the scheduled post in the planner.
    const text = [post.caption ?? "", post.hashtags.join(" ")].filter(Boolean).join("\n\n");
    const result = await client.createScheduledPost(
      {
        publicationDate: {
          dateTime: formatLocal(post.publishAt, post.pipeline.timezone),
          timezone: post.pipeline.timezone,
        },
        text,
        providers: [{ network: post.destination.network }],
        media: [hostedUrl],
        autoPublish: post.destination.autoPublish,
        draft: false,
        ...(post.destination.network === "instagram"
          ? { instagramData: { autoPublish: post.destination.autoPublish } }
          : {}),
      },
      blogId,
    );

    await db.scheduledPost.update({
      where: { id: scheduledPostId },
      data: {
        status: "SENT_TO_METRICOOL",
        metricoolPostId: result?.id != null ? String(result.id) : null,
      },
    });
    await db.pipelineMedia.updateMany({
      where: { pipelineId: post.pipelineId, mediaId: post.mediaId },
      data: { status: "PUBLISHED", publishedAt: post.publishAt },
    });

    // 4. Schedule the performance snapshot chain (T+0/1h/6h/24h/72h).
    for (const offset of SYNC_OFFSETS_MS) {
      const delay = Math.max(0, post.publishAt.getTime() + offset - Date.now());
      await enqueue(
        "performance_sync",
        "snapshot",
        { scheduledPostId, offsetMs: offset },
        { delay, userId: post.pipeline.userId },
      );
    }
    log.info({ scheduledPostId }, "post sent to Metricool");
  } catch (err) {
    if (err instanceof MetricoolApiError && err.isAuthError) {
      // Connection expired: pause this connection's publishing only —
      // other pipelines/connections are unaffected (pipeline isolation).
      await db.metricoolConnection.update({
        where: { id: connection.id },
        data: { status: "EXPIRED" },
      });
      await failPost(scheduledPostId, "Metricool token expired — reconnect in Integrations");
      return;
    }
    await failPost(scheduledPostId, String(err));
    throw err;
  }
}

async function failPost(id: string, error: string): Promise<void> {
  const post = await db.scheduledPost.update({
    where: { id },
    data: { status: "FAILED", error },
  });
  // Return the content to the pool so it can be rescheduled.
  await db.pipelineMedia.updateMany({
    where: { pipelineId: post.pipelineId, mediaId: post.mediaId, status: "SCHEDULED" },
    data: { status: "AVAILABLE", scheduledAt: null },
  });
}

/** "YYYY-MM-DDTHH:mm:ss" wall-clock in the pipeline's timezone. */
function formatLocal(date: Date, timezone: string): string {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(dtf.formatToParts(date).map((p) => [p.type, p.value]));
  const hour = parts.hour === "24" ? "00" : parts.hour;
  return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}:${parts.second}`;
}
