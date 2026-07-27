import type { Job } from "bullmq";
import { db } from "@/lib/db";
import {
  DEFAULT_DIVERSITY_RULES,
  rankPool,
  type DiversityRules,
  type RankableItem,
  type RecentPost,
} from "@/lib/scoring/ranker";
import { enqueue } from "@/lib/queue/queues";
import { scoped } from "@/lib/logger";

const log = scoped("pipeline-scheduler");
const LOOKAHEAD_HOURS = 24;
const PUBLISH_LEAD_MS = 5 * 60_000; // hand to Metricool 5 min before slot

/**
 * Jobs:
 *  - "sweep": enqueue one "fill" job per active pipeline (isolation: one
 *    pipeline throwing cannot abort the sweep of the others).
 *  - "fill" {pipelineId}: compute upcoming empty slots in the next 24h and
 *    fill them with the highest-ranked eligible pool content, honoring
 *    diversity rules and autopilot mode.
 */
export async function processPipelineSchedule(job: Job): Promise<void> {
  if (job.name === "sweep") return sweep();
  if (job.name === "fill") return fill(job.data.pipelineId as string);
}

async function sweep(): Promise<void> {
  const pipelines = await db.pipeline.findMany({
    where: { status: "ACTIVE", schedule: { active: true } },
    select: { id: true, userId: true },
  });
  for (const p of pipelines) {
    await enqueue("pipeline_schedule", "fill", { pipelineId: p.id }, { userId: p.userId });
  }
}

async function fill(pipelineId: string): Promise<void> {
  const pipeline = await db.pipeline.findUnique({
    where: { id: pipelineId },
    include: { schedule: { include: { slots: true } }, destination: true },
  });
  if (!pipeline || pipeline.status !== "ACTIVE") return;
  if (!pipeline.schedule?.active || !pipeline.destination) return;

  const slots = upcomingSlots(
    pipeline.schedule.slots,
    pipeline.timezone,
    LOOKAHEAD_HOURS,
  );
  if (slots.length === 0) return;

  const existing = await db.scheduledPost.findMany({
    where: {
      pipelineId,
      publishAt: { gte: new Date(), lte: new Date(Date.now() + LOOKAHEAD_HOURS * 3600_000) },
      status: { notIn: ["CANCELLED", "FAILED"] },
    },
    select: { publishAt: true },
  });
  const taken = new Set(existing.map((p) => p.publishAt.getTime()));
  const openSlots = slots.filter((s) => !taken.has(s.getTime()));
  if (openSlots.length === 0) return;

  // Ranked candidate pool with diversity context from recent posts.
  const pool = await db.pipelineMedia.findMany({
    where: { pipelineId, status: "AVAILABLE", media: { status: "READY" } },
    include: { media: { include: { analysis: true } } },
  });
  if (pool.length === 0) {
    log.info({ pipelineId }, "no available content for open slots");
    return;
  }

  const recent = await db.scheduledPost.findMany({
    where: { pipelineId, status: { in: ["SENT_TO_METRICOOL", "PUBLISHED"] } },
    orderBy: { publishAt: "desc" },
    take: 10,
    include: { media: { include: { analysis: true } } },
  });
  const recentPosts: RecentPost[] = recent
    .reverse()
    .map((p) => ({
      sourceId: p.media.sourceId,
      contentType: p.media.analysis?.contentType ?? null,
      hookType: p.media.analysis?.hookType ?? null,
    }));

  const rules = (pipeline.diversityRules as unknown as DiversityRules) ?? DEFAULT_DIVERSITY_RULES;
  const candidates: RankableItem[] = pool.map((pm) => ({
    pipelineMediaId: pm.id,
    mediaId: pm.mediaId,
    aiScore: pm.aiScore,
    addedAt: pm.addedAt,
    sourceId: pm.media.sourceId,
    contentType: pm.media.analysis?.contentType ?? null,
    hookType: pm.media.analysis?.hookType ?? null,
  }));

  const requireApproval = pipeline.autopilotMode !== "AUTO";
  let ranked = rankPool(candidates, recentPosts, { ...DEFAULT_DIVERSITY_RULES, ...rules });

  for (const slot of openSlots) {
    const pick = ranked.shift();
    if (!pick) break;

    const post = await db.scheduledPost.create({
      data: {
        pipelineId,
        destinationId: pipeline.destination.id,
        mediaId: pick.mediaId,
        publishAt: slot,
        status: requireApproval ? "PENDING_APPROVAL" : "QUEUED",
        captionSource: null,
      },
    });
    await db.pipelineMedia.update({
      where: { id: pick.pipelineMediaId },
      data: { status: "SCHEDULED", scheduledAt: slot, reason: pick.reasons.join("; ") },
    });
    await db.aiAuditLog.create({
      data: {
        userId: pipeline.userId,
        action: "schedule",
        subjectType: "scheduled_post",
        subjectId: post.id,
        reason: pick.reasons.join("; "),
        userAction: requireApproval ? null : "auto",
      },
    });

    if (!requireApproval) {
      const delay = Math.max(0, slot.getTime() - PUBLISH_LEAD_MS - Date.now());
      await enqueue(
        "metricool_publish",
        "publish",
        { scheduledPostId: post.id },
        { delay, userId: pipeline.userId },
      );
    }
  }
}

/** Expand schedule slots (dayOfWeek+time in pipeline tz) into upcoming Dates. */
function upcomingSlots(
  slots: { dayOfWeek: number; time: string }[],
  timezone: string,
  lookaheadHours: number,
): Date[] {
  const out: Date[] = [];
  const now = new Date();
  const horizon = new Date(now.getTime() + lookaheadHours * 3600_000);

  for (let dayOffset = 0; dayOffset <= Math.ceil(lookaheadHours / 24); dayOffset++) {
    const day = new Date(now);
    day.setUTCDate(day.getUTCDate() + dayOffset);
    for (const slot of slots) {
      const [h, m] = slot.time.split(":").map(Number);
      const candidate = zonedTimeToUtc(day, h, m ?? 0, timezone);
      if (candidate <= now || candidate > horizon) continue;
      const weekday = weekdayInZone(candidate, timezone);
      if (slot.dayOfWeek !== -1 && slot.dayOfWeek !== weekday) continue;
      out.push(candidate);
    }
  }
  return [...new Set(out.map((d) => d.getTime()))].sort().map((t) => new Date(t));
}

/** Build a UTC Date for wall-clock h:m in `timezone` on the same calendar day as `day`. */
function zonedTimeToUtc(day: Date, hour: number, minute: number, timezone: string): Date {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [y, mo, d] = fmt.format(day).split("-").map(Number);
  // Find the UTC instant whose wall clock in tz is y-mo-d hour:minute.
  const guess = Date.UTC(y, mo - 1, d, hour, minute);
  const offset = tzOffsetMs(new Date(guess), timezone);
  return new Date(guess - offset);
}

function tzOffsetMs(date: Date, timezone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(dtf.formatToParts(date).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour === "24" ? "0" : parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - date.getTime();
}

function weekdayInZone(date: Date, timezone: string): number {
  const name = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short" }).format(
    date,
  );
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(name);
}
