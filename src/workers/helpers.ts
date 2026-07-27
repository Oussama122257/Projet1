import { Worker, type Job, type Processor } from "bullmq";
import { redisConnection } from "@/lib/queue/connection";
import type { QueueName } from "@/lib/queue/queues";
import { db } from "@/lib/db";
import { scoped } from "@/lib/logger";

/**
 * Create a worker with uniform logging + jobs-table mirroring. Errors are
 * contained per job (BullMQ retries with backoff) so one pipeline's failure
 * never halts another's processing.
 */
export function createWorker(
  queueName: QueueName,
  processor: Processor,
  concurrency = 3,
): Worker {
  const log = scoped(`worker:${queueName}`);
  const worker = new Worker(queueName, processor, {
    connection: redisConnection(),
    concurrency,
  });

  worker.on("active", (job) => {
    log.info({ jobId: job.id, name: job.name }, "job active");
    void mirrorStatus(job, "ACTIVE");
  });
  worker.on("completed", (job) => {
    log.info({ jobId: job.id, name: job.name }, "job completed");
    void mirrorStatus(job, "COMPLETED");
  });
  worker.on("failed", (job, err) => {
    log.error({ jobId: job?.id, name: job?.name, err: err.message }, "job failed");
    if (job) void mirrorStatus(job, "FAILED", err.message);
  });

  return worker;
}

async function mirrorStatus(
  job: Job,
  status: "ACTIVE" | "COMPLETED" | "FAILED",
  error?: string,
): Promise<void> {
  try {
    await db.job.updateMany({
      where: { queue: job.queueName, bullJobId: String(job.id) },
      data: { status, attempts: job.attemptsMade, error: error ?? null },
    });
  } catch {
    // observability mirror must never break job processing
  }
}
