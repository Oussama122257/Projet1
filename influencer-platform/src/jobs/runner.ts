import "dotenv/config";
import cron from "node-cron";
import { env, flags } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { runSyncJob } from "./syncMetrics";

const log = createLogger("cron");

/**
 * Standalone scheduler process (`npm run dev:cron` / `npm run worker`).
 *
 * Kept out of the Next.js server process on purpose: serverless deploys spin up
 * and tear down instances constantly, so an in-process timer would fire an
 * unpredictable number of times. In production either run this as a small
 * always-on worker, or drop it entirely and let Vercel Cron hit
 * POST /api/cron/sync on a schedule.
 *
 * Upgrade path: swap node-cron for BullMQ's repeatable jobs once there is more
 * than one worker — node-cron has no distributed lock, so two instances of this
 * process would both fire. The `running` guard below only protects against
 * overlap *within* one process.
 */

let running = false;

async function tick(trigger: "schedule" | "startup") {
  if (running) {
    log.warn("previous sync still running, skipping this tick", { trigger });
    return;
  }
  running = true;
  try {
    const report = await runSyncJob();
    log.info("tick complete", {
      trigger,
      processed: report.processed,
      paid: report.payoutsSucceeded,
      held: report.flagsRaised,
    });
  } catch (err) {
    log.error("sync run failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  } finally {
    running = false;
  }
}

function main() {
  if (!flags.cronEnabled) {
    log.warn("CRON_ENABLED=false — scheduler exiting without registering jobs");
    return;
  }

  const schedule = env.SYNC_CRON_SCHEDULE;
  if (!cron.validate(schedule)) {
    log.error("invalid SYNC_CRON_SCHEDULE, refusing to start", { schedule });
    process.exit(1);
  }

  cron.schedule(schedule, () => void tick("schedule"));
  log.info("scheduler registered", {
    schedule,
    mockMetrics: flags.useMockMetrics,
    stripeConfigured: flags.stripeReady,
  });

  if (process.env.RUN_ON_START === "true") {
    void tick("startup");
  }

  const shutdown = (signal: string) => {
    log.info("shutting down", { signal });
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main();
