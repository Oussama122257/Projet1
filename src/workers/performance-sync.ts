import type { Job } from "bullmq";
import { db } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto";
import { MetricoolClient } from "@/lib/metricool";
import { scoped } from "@/lib/logger";

const log = scoped("performance-sync");

/**
 * "snapshot" {scheduledPostId, offsetMs}: pull real metrics from the official
 * Metricool analytics endpoints for the destination and store a snapshot.
 * Only metrics actually present in the API response are stored — absent
 * metrics remain NULL and are never fabricated.
 */
export async function processPerformanceSync(job: Job): Promise<void> {
  const { scheduledPostId } = job.data as { scheduledPostId: string; offsetMs: number };

  const post = await db.scheduledPost.findUnique({
    where: { id: scheduledPostId },
    include: { destination: { include: { connection: true } }, media: true },
  });
  if (!post || !["SENT_TO_METRICOOL", "PUBLISHED"].includes(post.status)) return;

  const connection = post.destination.connection;
  if (connection.status !== "CONNECTED") {
    log.warn({ scheduledPostId }, "skipping sync: connection not healthy");
    return;
  }

  const client = new MetricoolClient({
    userToken: decryptSecret(connection.encryptedUserToken),
    userId: connection.metricoolUserId,
  });

  const from = fmtDate(new Date(post.publishAt.getTime() - 86_400_000));
  const to = fmtDate(new Date(Date.now() + 86_400_000));

  // Reels analytics list for the window; match our post by permalink/id when
  // possible. Exact response fields come from the official swagger; we map
  // defensively and keep only what exists.
  const raw = await client.getReelsAnalytics(post.destination.blogId, { from, to });
  const items: Record<string, unknown>[] = Array.isArray(raw)
    ? (raw as Record<string, unknown>[])
    : ((raw as { data?: Record<string, unknown>[] })?.data ?? []);

  const match = findMatching(items, post.metricoolPostId, post.media.canonicalUrl);
  if (!match) {
    log.info({ scheduledPostId }, "no matching analytics item yet");
    return;
  }

  const num = (keys: string[]): number | null => {
    for (const k of keys) {
      const v = match[k];
      if (typeof v === "number" && Number.isFinite(v)) return v;
    }
    return null;
  };

  const views = num(["views", "plays", "videoViews", "impressions"]);
  const reach = num(["reach"]);
  const likes = num(["likes", "likeCount"]);
  const comments = num(["comments", "commentCount"]);
  const shares = num(["shares", "shareCount"]);
  const saves = num(["saves", "saved", "saveCount"]);
  const interactions = num(["interactions", "engagement"]);

  const engagementRate =
    reach && reach > 0
      ? Number(
          (
            ((interactions ?? (likes ?? 0) + (comments ?? 0) + (shares ?? 0) + (saves ?? 0)) /
              reach) *
            100
          ).toFixed(3),
        )
      : null;

  await db.postPerformance.create({
    data: {
      scheduledPostId,
      destinationId: post.destinationId,
      platformPostId: (match.id != null ? String(match.id) : null) ?? post.metricoolPostId,
      views,
      reach,
      likes,
      comments,
      shares,
      saves,
      watchTime: num(["watchTime", "totalWatchTime", "avgWatchTime"]),
      completionRate: num(["completionRate", "retentionRate"]),
      engagementRate,
      followersGained: num(["followersGained", "follows"]),
    },
  });

  if (post.status === "SENT_TO_METRICOOL") {
    await db.scheduledPost.update({
      where: { id: scheduledPostId },
      data: { status: "PUBLISHED", publishedAt: post.publishAt },
    });
  }
  log.info({ scheduledPostId, views, reach }, "performance snapshot stored");
}

function findMatching(
  items: Record<string, unknown>[],
  metricoolPostId: string | null,
  canonicalUrl: string | null,
): Record<string, unknown> | null {
  for (const item of items) {
    if (metricoolPostId && String(item.id ?? "") === metricoolPostId) return item;
    const link = String(item.link ?? item.permalink ?? item.url ?? "");
    if (canonicalUrl && link && link.includes(canonicalUrl)) return item;
  }
  return null;
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
