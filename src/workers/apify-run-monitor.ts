import type { Job } from "bullmq";
import { db } from "@/lib/db";
import {
  ApifyDatasetService,
  ApifyNormalizer,
  ApifyRunService,
  type NormalizedMediaItem,
} from "@/lib/apify";
import { enqueue } from "@/lib/queue/queues";
import { scoped } from "@/lib/logger";

const log = scoped("apify-run-monitor");

const MAX_POLL_ATTEMPTS = 60; // ~2h with capped backoff
const POLL_BASE_DELAY_MS = 15_000;
const POLL_MAX_DELAY_MS = 120_000;

/**
 * "monitor" {runRecordId, pollAttempt}: poll the Apify run; on success fetch
 * the dataset, normalize, dedupe against the global media library, create
 * media rows, fan out to every pipeline using the source, and enqueue
 * downloads. Self-requeues with backoff while the run is still going.
 */
export async function processApifyRun(job: Job): Promise<void> {
  const { runRecordId, pollAttempt = 0 } = job.data as {
    runRecordId: string;
    pollAttempt?: number;
  };

  const runRecord = await db.apifyRun.findUnique({
    where: { id: runRecordId },
    include: { source: true },
  });
  if (!runRecord?.apifyRunId) return;
  if (["SUCCEEDED", "FAILED", "TIMED_OUT", "ABORTED"].includes(runRecord.status)) return;

  const runService = new ApifyRunService();
  const run = await runService.getRun(runRecord.apifyRunId);

  if (!runService.isTerminal(run.status)) {
    if (pollAttempt >= MAX_POLL_ATTEMPTS) {
      await runService.abortRun(runRecord.apifyRunId).catch(() => undefined);
      await db.apifyRun.update({
        where: { id: runRecordId },
        data: { status: "TIMED_OUT", error: "Monitor TTL exceeded", finishedAt: new Date() },
      });
      return;
    }
    const delay = Math.min(POLL_BASE_DELAY_MS * 1.5 ** pollAttempt, POLL_MAX_DELAY_MS);
    await enqueue(
      "apify_run",
      "monitor",
      { runRecordId, pollAttempt: pollAttempt + 1 },
      { delay, userId: runRecord.source.userId },
    );
    return;
  }

  if (run.status !== "SUCCEEDED") {
    await db.apifyRun.update({
      where: { id: runRecordId },
      data: {
        status: run.status === "ABORTED" ? "ABORTED" : run.status === "TIMED-OUT" ? "TIMED_OUT" : "FAILED",
        error: run.statusMessage ?? `Run ended with status ${run.status}`,
        finishedAt: new Date(),
      },
    });
    return;
  }

  const datasetId = run.defaultDatasetId ?? runRecord.datasetId;
  if (!datasetId) throw new Error("Run succeeded but has no dataset id");

  const items = await new ApifyDatasetService().getAllItems(datasetId);
  const normalized = new ApifyNormalizer(runRecord.source.platform).normalizeAll(items);
  log.info({ runRecordId, raw: items.length, normalized: normalized.length }, "dataset fetched");

  const imported = await importNewMedia(runRecord.source.userId, runRecord.sourceId, normalized);

  await db.apifyRun.update({
    where: { id: runRecordId },
    data: {
      status: "SUCCEEDED",
      itemsFound: normalized.length,
      itemsImported: imported,
      finishedAt: new Date(),
    },
  });
  await db.source.update({
    where: { id: runRecord.sourceId },
    data: {
      videosFound: { increment: normalized.length },
      videosImported: { increment: imported },
    },
  });
}

/**
 * Dedupe (platformMediaId → canonicalUrl) and create media rows; associate
 * each new/known media with every pipeline consuming this source; enqueue
 * downloads only for brand-new media (one Apify scan feeds N pipelines).
 */
async function importNewMedia(
  userId: string,
  sourceId: string,
  items: NormalizedMediaItem[],
): Promise<number> {
  const pipelineLinks = await db.pipelineSource.findMany({
    where: { sourceId, pipeline: { status: { in: ["ACTIVE", "DRAFT", "PAUSED"] } } },
    select: { pipelineId: true },
  });
  const pipelineIds = pipelineLinks.map((l) => l.pipelineId);

  let imported = 0;
  for (const item of items) {
    const existing = await db.media.findFirst({
      where: {
        OR: [
          item.platformMediaId
            ? { platform: item.platform, platformMediaId: item.platformMediaId }
            : undefined,
          item.canonicalUrl ? { canonicalUrl: item.canonicalUrl } : undefined,
        ].filter(Boolean) as object[],
      },
    });

    const media =
      existing ??
      (await db.media.create({
        data: {
          userId,
          platform: item.platform,
          platformMediaId: item.platformMediaId,
          sourceId,
          originalUrl: item.originalUrl,
          canonicalUrl: item.canonicalUrl,
          caption: item.caption,
          hashtags: item.hashtags,
          duration: item.duration,
          width: item.width,
          height: item.height,
          publishedAt: item.publishedAt,
          raw: item.raw as object,
          status: "DISCOVERED",
        },
      }));

    if (!existing) {
      imported++;
      if (item.mediaUrl) {
        await enqueue(
          "media_download",
          "download",
          { mediaId: media.id, mediaUrl: item.mediaUrl, thumbnailUrl: item.thumbnailUrl },
          { userId },
        );
      }
    }

    // Fan out into every pipeline pool that consumes this source.
    for (const pipelineId of pipelineIds) {
      await db.pipelineMedia.upsert({
        where: { pipelineId_mediaId: { pipelineId, mediaId: media.id } },
        update: {},
        create: { pipelineId, mediaId: media.id, status: "AVAILABLE" },
      });
    }
  }
  return imported;
}
