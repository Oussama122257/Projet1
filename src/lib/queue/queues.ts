import { Queue, type JobsOptions } from "bullmq";
import type { Prisma } from "@prisma/client";
import { redisConnection } from "./connection";

export const QUEUE_NAMES = [
  "source_scan",
  "apify_run",
  "media_download",
  "media_processing",
  "ai_analysis",
  "ai_embedding",
  "pipeline_schedule",
  "metricool_publish",
  "performance_sync",
  "experiment_analysis",
  "ai_insights",
  "storage_cleanup",
] as const;

export type QueueName = (typeof QUEUE_NAMES)[number];

const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 2000 },
  removeOnComplete: { age: 24 * 3600, count: 1000 },
  removeOnFail: { age: 7 * 24 * 3600 },
};

const queues = new Map<QueueName, Queue>();

export function getQueue(name: QueueName): Queue {
  let q = queues.get(name);
  if (!q) {
    q = new Queue(name, {
      connection: redisConnection(),
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });
    queues.set(name, q);
  }
  return q;
}

/** Enqueue + mirror into the jobs table for UI observability. */
export async function enqueue(
  name: QueueName,
  jobName: string,
  payload: Record<string, unknown>,
  opts: JobsOptions & { userId?: string } = {},
): Promise<string> {
  const { userId, ...jobOpts } = opts;
  const job = await getQueue(name).add(jobName, payload, jobOpts);
  const { db } = await import("@/lib/db");
  await db.job.create({
    data: {
      userId: userId ?? null,
      queue: name,
      name: jobName,
      bullJobId: job.id ?? null,
      status: jobOpts.delay ? "DELAYED" : "QUEUED",
      payload: payload as Prisma.InputJsonValue,
    },
  });
  return job.id ?? "";
}
