import type { Job } from "bullmq";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { ApifyRunService, buildActorInput } from "@/lib/apify";
import { enqueue } from "@/lib/queue/queues";
import { scoped } from "@/lib/logger";

const log = scoped("source-scanner");
const SCAN_RESULT_LIMIT = 50;

/**
 * Jobs:
 *  - "sweep": enumerate sources due for a scan and enqueue one "scan" job each
 *  - "scan" {sourceId}: guards + start the Apify Actor run, then hand off to
 *    the apify_run monitor queue. Never blocks waiting for the run.
 */
export async function processSourceScan(job: Job): Promise<void> {
  if (job.name === "sweep") return sweep();
  if (job.name === "scan") return scan(job.data.sourceId as string);
}

async function sweep(): Promise<void> {
  const sources = await db.source.findMany({
    where: { status: "ACTIVE", authorizationConfirmedAt: { not: null } },
    select: { id: true, userId: true, lastScanAt: true, monitoringFrequencyMins: true },
  });
  const now = Date.now();
  for (const s of sources) {
    const due =
      !s.lastScanAt ||
      now - s.lastScanAt.getTime() >= s.monitoringFrequencyMins * 60_000;
    if (!due) continue;
    await enqueue("source_scan", "scan", { sourceId: s.id }, { userId: s.userId });
  }
}

async function scan(sourceId: string): Promise<void> {
  const source = await db.source.findUnique({ where: { id: sourceId } });
  if (!source) return;

  // Guard rails: active, user-authorized, no concurrent run for this source.
  if (source.status !== "ACTIVE") {
    log.info({ sourceId }, "skipping scan: source not active");
    return;
  }
  if (!source.authorizationConfirmedAt) {
    log.warn({ sourceId }, "skipping scan: reuse authorization not confirmed by user");
    return;
  }
  const activeRun = await db.apifyRun.findFirst({
    where: { sourceId, status: { in: ["PENDING", "RUNNING"] } },
  });
  if (activeRun) {
    log.info({ sourceId, runId: activeRun.id }, "skipping scan: run already active");
    return;
  }

  const actorId = env().APIFY_ACTOR_ID;
  if (!actorId) throw new Error("APIFY_ACTOR_ID not configured");

  const username = source.url.split("/").filter(Boolean).pop() ?? source.url;
  const input = buildActorInput(
    { url: source.url, username, limit: SCAN_RESULT_LIMIT },
    source.inputTemplate ?? undefined,
  );

  const runRecord = await db.apifyRun.create({
    data: { sourceId, actorId, status: "PENDING" },
  });

  try {
    const runService = new ApifyRunService();
    const run = await runService.startRun(actorId, input);
    await db.apifyRun.update({
      where: { id: runRecord.id },
      data: { apifyRunId: run.id, datasetId: run.defaultDatasetId, status: "RUNNING" },
    });
    await db.source.update({
      where: { id: sourceId },
      data: { lastScanAt: new Date() },
    });
    await enqueue(
      "apify_run",
      "monitor",
      { runRecordId: runRecord.id, pollAttempt: 0 },
      { delay: 15_000, userId: source.userId },
    );
    log.info({ sourceId, apifyRunId: run.id }, "apify run started");
  } catch (err) {
    await db.apifyRun.update({
      where: { id: runRecord.id },
      data: { status: "FAILED", error: String(err), finishedAt: new Date() },
    });
    throw err;
  }
}
