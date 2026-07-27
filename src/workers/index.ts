/**
 * Worker fleet bootstrap. Run with: npm run worker
 * Each worker is isolated: a failing job retries with backoff and never
 * blocks other queues or pipelines.
 */
import type { Worker } from "bullmq";
import { createWorker } from "./helpers";
import { processSourceScan } from "./source-scanner";
import { processApifyRun } from "./apify-run-monitor";
import { processMediaDownload } from "./media-ingestion";
import { processAiAnalysis } from "./ai-analysis";
import { processPipelineSchedule } from "./pipeline-scheduler";
import { processMetricoolPublish } from "./metricool-publisher";
import { processPerformanceSync } from "./performance-sync";
import { getQueue } from "@/lib/queue/queues";
import { logger } from "@/lib/logger";

async function main(): Promise<void> {
  const workers: Worker[] = [
    createWorker("source_scan", processSourceScan, 2),
    createWorker("apify_run", processApifyRun, 4),
    createWorker("media_download", processMediaDownload, 3),
    createWorker("ai_analysis", processAiAnalysis, 2),
    createWorker("pipeline_schedule", processPipelineSchedule, 2),
    createWorker("metricool_publish", processMetricoolPublish, 2),
    createWorker("performance_sync", processPerformanceSync, 3),
  ];

  // Repeatable sweeps (BullMQ cron). Idempotent registration by jobId.
  await getQueue("source_scan").add(
    "sweep",
    {},
    { repeat: { pattern: "*/5 * * * *" }, jobId: "source-scan-sweep" },
  );
  await getQueue("pipeline_schedule").add(
    "sweep",
    {},
    { repeat: { pattern: "*/5 * * * *" }, jobId: "pipeline-schedule-sweep" },
  );

  logger.info({ workers: workers.length }, "contentloop worker fleet started");

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "draining workers");
    await Promise.allSettled(workers.map((w) => w.close()));
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((err) => {
  logger.error({ err: String(err) }, "worker bootstrap failed");
  process.exit(1);
});
